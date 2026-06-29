import {
  AppWindowIcon,
  ArchiveIcon,
  CodeIcon,
  FileIcon,
  FileTextIcon,
  ImageIcon,
  MusicIcon,
  VideoIcon,
  type IconComponent
} from '../../icons'

export type FileKind = 'image' | 'video' | 'pdf' | 'audio' | 'archive' | 'app' | 'code' | 'generic'

const KIND_BY_EXTENSION: Record<string, FileKind> = {
  '.png': 'image',
  '.jpg': 'image',
  '.jpeg': 'image',
  '.gif': 'image',
  '.webp': 'image',
  '.svg': 'image',
  '.heic': 'image',
  '.mp4': 'video',
  '.mov': 'video',
  '.avi': 'video',
  '.mkv': 'video',
  '.webm': 'video',
  '.m4v': 'video',
  '.pdf': 'pdf',
  '.mp3': 'audio',
  '.wav': 'audio',
  '.m4a': 'audio',
  '.flac': 'audio',
  '.aac': 'audio',
  '.tar.gz': 'archive',
  '.zip': 'archive',
  '.rar': 'archive',
  '.7z': 'archive',
  '.tar': 'archive',
  '.gz': 'archive',
  '.dmg': 'app',
  '.pkg': 'app',
  '.exe': 'app',
  '.msi': 'app',
  '.app': 'app',
  '.ts': 'code',
  '.tsx': 'code',
  '.js': 'code',
  '.jsx': 'code',
  '.json': 'code',
  '.css': 'code',
  '.html': 'code',
  '.md': 'code'
}

export function getFileKind(name: string): FileKind {
  const lowerName = name.toLowerCase()
  for (const [ext, kind] of Object.entries(KIND_BY_EXTENSION)) {
    if (lowerName.endsWith(ext)) return kind
  }
  return 'generic'
}

const ICON_BY_KIND: Record<FileKind, IconComponent> = {
  image: ImageIcon,
  video: VideoIcon,
  pdf: FileTextIcon,
  audio: MusicIcon,
  archive: ArchiveIcon,
  app: AppWindowIcon,
  code: CodeIcon,
  generic: FileIcon
}

export interface FileKindIconProps {
  kind: FileKind
  size?: number
  color?: string
}

export function FileKindIcon({ kind, size = 15, color }: FileKindIconProps) {
  const Icon = ICON_BY_KIND[kind]
  return <Icon size={size} color={color} />
}
