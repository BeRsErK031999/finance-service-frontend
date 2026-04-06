import type { ChangeEvent } from 'react'

import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined'
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded'
import {
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
} from '@mui/material'

import {
  ACCEPTED_FILE_TYPES,
  UPLOAD_REQUIREMENTS_HINT,
  formatFileSize,
  mergeUniqueFiles,
  toFileSignature,
} from '../lib/file-attachments'

interface PendingFileAttachmentsFieldProps {
  disabled?: boolean
  files: File[]
  onChange: (files: File[]) => void
}

export function PendingFileAttachmentsField({
  disabled = false,
  files,
  onChange,
}: PendingFileAttachmentsFieldProps) {
  const handleSelectFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files ?? [])

    event.target.value = ''

    if (nextFiles.length === 0) {
      return
    }

    onChange(mergeUniqueFiles(files, nextFiles))
  }

  const handleRemoveFile = (fileToRemove: File) => {
    const fileSignature = toFileSignature(fileToRemove)

    onChange(files.filter((file) => toFileSignature(file) !== fileSignature))
  }

  return (
    <Paper sx={{ p: { xs: 2.5, md: 3 } }} variant="outlined">
      <Stack spacing={2.5}>
        <Stack
          alignItems={{ xs: 'stretch', md: 'flex-start' }}
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          spacing={2}
        >
          <Stack spacing={0.5}>
            <Typography variant="h6">Файлы и документы</Typography>
            <Typography color="text.secondary" variant="body2">
              Выберите вложения сейчас. Они загрузятся автоматически сразу после
              создания записи.
            </Typography>
            <Typography color="text.secondary" variant="caption">
              {UPLOAD_REQUIREMENTS_HINT}
            </Typography>
          </Stack>

          <Stack alignItems={{ xs: 'stretch', md: 'flex-end' }} spacing={1}>
            <Button
              component="label"
              disabled={disabled}
              startIcon={<UploadFileRoundedIcon />}
              variant="outlined"
            >
              {files.length > 0 ? 'Добавить ещё файлы' : 'Добавить файлы'}
              <input
                accept={ACCEPTED_FILE_TYPES}
                disabled={disabled}
                hidden
                multiple
                onChange={handleSelectFiles}
                type="file"
              />
            </Button>
            <Chip
              label={`${files.length} ${getFileCountLabel(files.length)}`}
              size="small"
              variant="outlined"
            />
          </Stack>
        </Stack>

        {files.length === 0 ? (
          <Typography color="text.secondary" variant="body2">
            Пока ничего не выбрано. Если вложения не нужны, запись можно создать
            и без них.
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            {files.map((file) => (
              <Paper
                key={toFileSignature(file)}
                sx={{ p: 2 }}
                variant="outlined"
              >
                <Stack
                  alignItems={{ xs: 'stretch', md: 'center' }}
                  direction={{ xs: 'column', md: 'row' }}
                  justifyContent="space-between"
                  spacing={1.5}
                >
                  <Stack spacing={0.5}>
                    <Stack alignItems="center" direction="row" spacing={1}>
                      <InsertDriveFileOutlinedIcon color="action" />
                      <Typography variant="body2">{file.name}</Typography>
                    </Stack>
                    <Typography color="text.secondary" variant="caption">
                      {formatFileSize(file.size)}
                    </Typography>
                  </Stack>

                  <Button
                    color="error"
                    disabled={disabled}
                    onClick={() => handleRemoveFile(file)}
                    startIcon={<DeleteOutlineRoundedIcon />}
                    variant="text"
                  >
                    Убрать
                  </Button>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
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
