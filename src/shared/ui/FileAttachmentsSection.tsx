import { useState } from 'react'
import type { ChangeEvent } from 'react'

import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined'
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded'
import {
  Alert,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
} from '@mui/material'

import {
  useDeleteFileAttachment,
  useFileDownloadDescriptor,
  usePlannedCostFiles,
  usePlannedPaymentFiles,
  useUploadFileAttachment,
  type FileAttachmentOwner,
} from '../api/file-attachments.query'
import { parseApiError } from '../api/parse-api-error'
import { appConfig } from '../config/env'
import { formatDateTime } from '../lib/format'
import type { ApiError } from '../types/api'
import type { FileAttachment } from '../types/file-attachment'
import { ActionAvailabilityHint } from './ActionAvailabilityHint'
import { CollapsibleSectionCard } from './CollapsibleSectionCard'
import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'
import { LoadingState } from './LoadingState'

const ACCEPTED_FILE_TYPES = '.pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx'
const UPLOAD_REQUIREMENTS_HINT =
  'Можно загрузить PDF, PNG, JPG, DOC, DOCX, XLS или XLSX размером до 20 МБ.'

interface FileAttachmentsSectionProps {
  owner: FileAttachmentOwner
  canManageFiles: boolean
  manageFilesHint: string
  defaultExpanded?: boolean
}

export function FileAttachmentsSection({
  owner,
  canManageFiles,
  manageFilesHint,
  defaultExpanded = false,
}: FileAttachmentsSectionProps) {
  const plannedPaymentFilesQuery = usePlannedPaymentFiles(
    owner.type === 'planned-payment' ? owner.id : undefined,
  )
  const plannedCostFilesQuery = usePlannedCostFiles(
    owner.type === 'planned-cost' ? owner.id : undefined,
  )
  const filesQuery =
    owner.type === 'planned-payment' ? plannedPaymentFilesQuery : plannedCostFilesQuery
  const uploadFileMutation = useUploadFileAttachment(owner)
  const deleteFileMutation = useDeleteFileAttachment(owner)
  const downloadFileMutation = useFileDownloadDescriptor()
  const files = filesQuery.data?.items ?? []
  const [actionError, setActionError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const headerHint = canManageFiles ? UPLOAD_REQUIREMENTS_HINT : manageFilesHint

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    event.target.value = ''

    if (!file) {
      return
    }

    setActionError(null)

    try {
      await uploadFileMutation.mutateAsync(file)
    } catch (error) {
      setActionError(toApiError(error).message)
    }
  }

  const handleDelete = async (file: FileAttachment) => {
    if (!window.confirm(`Удалить файл "${file.fileName}"?`)) {
      return
    }

    setActionError(null)
    setDeletingId(file.id)

    try {
      await deleteFileMutation.mutateAsync(file.id)
    } catch (error) {
      setActionError(toApiError(error).message)
    } finally {
      setDeletingId(null)
    }
  }

  const handleDownload = async (file: FileAttachment) => {
    setActionError(null)
    setDownloadingId(file.id)

    try {
      const descriptor = await downloadFileMutation.mutateAsync(file.id)

      openDownloadUrl(descriptor.url)
    } catch (error) {
      setActionError(toApiError(error).message)
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <CollapsibleSectionCard
      actions={
        <Stack alignItems={{ xs: 'stretch', md: 'flex-end' }} spacing={1}>
          <Button
            component="label"
            disabled={!canManageFiles || uploadFileMutation.isPending}
            startIcon={<UploadFileRoundedIcon />}
            variant="contained"
          >
            {uploadFileMutation.isPending ? 'Загружаем...' : 'Загрузить файл'}
            <input
              accept={ACCEPTED_FILE_TYPES}
              disabled={!canManageFiles || uploadFileMutation.isPending}
              hidden
              onChange={handleUpload}
              type="file"
            />
          </Button>
          <ActionAvailabilityHint message={headerHint} />
        </Stack>
      }
      defaultExpanded={defaultExpanded}
      subtitle="Файлы, прикреплённые к этой записи."
      summary={
        <Stack direction="row" spacing={1}>
          <Chip
            label={`${files.length} ${getFileCountLabel(files.length)}`}
            size="small"
            variant="outlined"
          />
        </Stack>
      }
      surface="paper"
      title="Файлы"
    >
      <Stack spacing={3}>
        {actionError ? (
          <Alert severity="error" variant="outlined">
            {actionError}
          </Alert>
        ) : null}

        {filesQuery.isPending ? (
          <LoadingState
            description="Загружаем файлы, прикреплённые к этой записи."
            title="Загружаем файлы"
          />
        ) : null}

        {filesQuery.isError ? (
          <ErrorState
            action={
              <Button onClick={() => void filesQuery.refetch()} variant="contained">
                Повторить
              </Button>
            }
            description={filesQuery.error.message}
            title="Не удалось загрузить файлы"
          />
        ) : null}

        {!filesQuery.isPending && !filesQuery.isError && files.length === 0 ? (
          <EmptyState
            description={
              canManageFiles
                ? 'У этой записи пока нет файлов. Загрузите первое вложение.'
                : 'У этой записи пока нет файлов.'
            }
            title="Файлы пока не добавлены"
          />
        ) : null}

        {!filesQuery.isPending && !filesQuery.isError && files.length > 0 ? (
          <Stack spacing={2}>
            {files.map((file) => (
              <FileAttachmentListItem
                canManageFiles={canManageFiles}
                file={file}
                isDeleting={deletingId === file.id}
                isDownloading={downloadingId === file.id}
                key={file.id}
                onDelete={handleDelete}
                onDownload={handleDownload}
              />
            ))}
          </Stack>
        ) : null}
      </Stack>
    </CollapsibleSectionCard>
  )
}

function FileAttachmentListItem({
  canManageFiles,
  file,
  isDeleting,
  isDownloading,
  onDelete,
  onDownload,
}: {
  canManageFiles: boolean
  file: FileAttachment
  isDeleting: boolean
  isDownloading: boolean
  onDelete: (file: FileAttachment) => Promise<void>
  onDownload: (file: FileAttachment) => Promise<void>
}) {
  return (
    <Paper sx={{ p: { xs: 2.5, md: 3 } }} variant="outlined">
      <Stack spacing={2.5}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          spacing={2}
        >
          <Stack spacing={1}>
            <Stack
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              direction={{ xs: 'column', sm: 'row' }}
              flexWrap="wrap"
              spacing={1}
            >
              <Stack alignItems="center" direction="row" spacing={1}>
                <InsertDriveFileOutlinedIcon color="action" />
                <Typography variant="subtitle1">{file.fileName}</Typography>
              </Stack>
              <Chip label={formatFileSize(file.size)} size="small" variant="outlined" />
            </Stack>
            <Typography color="text.secondary" variant="body2">
              Загружен: {formatDateTime(file.uploadedAt)}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              Тип: {file.mimeType}
            </Typography>
            {file.comment ? (
              <Typography color="text.secondary" variant="body2">
                Комментарий: {file.comment}
              </Typography>
            ) : null}
          </Stack>

          <Stack alignItems={{ xs: 'stretch', md: 'flex-end' }} spacing={1}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button
                disabled={isDownloading}
                onClick={() => void onDownload(file)}
                startIcon={<DownloadRoundedIcon />}
                variant="outlined"
              >
                {isDownloading ? 'Скачиваем...' : 'Скачать'}
              </Button>
              <Button
                color="error"
                disabled={!canManageFiles || isDeleting}
                onClick={() => void onDelete(file)}
                startIcon={<DeleteOutlineRoundedIcon />}
                variant="outlined"
              >
                {isDeleting ? 'Удаляем...' : 'Удалить'}
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  )
}

function getFileCountLabel(count: number) {
  const remainder10 = count % 10
  const remainder100 = count % 100

  if (remainder10 === 1 && remainder100 !== 11) {
    return 'файл'
  }

  if (
    remainder10 >= 2 &&
    remainder10 <= 4 &&
    (remainder100 < 12 || remainder100 > 14)
  ) {
    return 'файла'
  }

  return 'файлов'
}

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} Б`
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} КБ`
  }

  return `${(size / (1024 * 1024)).toFixed(1)} МБ`
}

function openDownloadUrl(url: string) {
  const link = document.createElement('a')

  link.href = resolveDownloadUrl(url)
  link.rel = 'noopener noreferrer'
  link.target = '_blank'
  document.body.append(link)
  link.click()
  link.remove()
}

function resolveDownloadUrl(url: string) {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  if (!appConfig.apiBaseUrl.startsWith('/')) {
    return new URL(url, appConfig.apiBaseUrl).toString()
  }

  const normalizedApiBaseUrl =
    appConfig.apiBaseUrl === '/'
      ? ''
      : appConfig.apiBaseUrl.replace(/\/$/, '')
  const normalizedPath = url.startsWith('/') ? url : `/${url}`

  return `${normalizedApiBaseUrl}${normalizedPath}`
}

function toApiError(error: unknown): ApiError {
  if (isApiError(error)) {
    return error
  }

  return parseApiError(error)
}

function isApiError(error: unknown): error is ApiError {
  if (typeof error !== 'object' || error === null) {
    return false
  }

  return typeof (error as { message?: unknown }).message === 'string'
}
