export type BaseContentItem = {
  content: string
  frontmatter: {
    [key: string]: string
  }
  title: string
  subtitle?: string
  description: string
  canonical?: string
  slug: string
  date: Date
  ghMetadata: GHMetadata
  image: string
  alt?: string
  issueNumber: string
}

export type BlogItem = BaseContentItem & {
  type: 'blog'
  category: string
  tags: string[]
  readingTime: string
}

export type GalleryItem = BaseContentItem & {
  type: 'gallery'
  images: GalleryImage[]
  warn: boolean
}

export type GalleryImage = {
  src: string
  alt: string
  size: string
}

export type GHMetadata = {
  issueUrl: string
  commentsUrl: string
  title: string
  created_at: Date
  updated_at: Date
  reactions: GHReactions
}

export type GHReactions = {
  total_count: number
  '+1': number
  '-1': number
  laugh: number
  hooray: number
  confused: number
  heart: number
  rocket: number
  eyes: number
}

export type GHComment = {
  body: string
  user: GHUser
  created_at: Date
  updated_at: Date
  html_url: string
  issue_url: string
  author_association: string
  reactions: GHReactions
}

export type GHUser = {
  login: string
  avatar_url: string
  id: number
  node_id: string
  avatar_url: string
  gravatar_id: string
  url: string
  html_url: string
  followers_url: string
  following_url: string
  gists_url: string
  starred_url: string
  subscriptions_url: string
  organizations_url: string
  repos_url: string
  events_url: string
  received_events_url: string
  type: 'User'
  site_admin: boolean
}

export type GithubIssue = {
  user: GHUser
  number: string
  labels: {
    name: string
  }[]
  title: string
  body: string
  created_at: Date
  updated_at: Date
  html_url: string
  comments_url: string
  reactions: GHReactions
}
