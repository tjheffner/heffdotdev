import { dev } from '$app/environment'
import {
  GH_USER_REPO,
  APPROVED_POSTERS_GH_USERNAME,
  GH_PUBLISHED_TAGS,
  REPO_OWNER,
} from './siteConfig'
import { slugify, readingTime, baseIssueContent, formatContent } from './utils'
import parse from 'parse-link-header'

let allBlogposts = []
let allGalleries = []
let allPosts = []

/*
 * Gets all github issues with a provided label.
 *
 * PAGETYPE: 'LABEL'
 * Blog posts: 'Published'
 * Gallery pages: 'Gallery'
 */
export async function listContentFromIssues(fetch, label) {
  let allContentWithLabel = []
  let next = null

  const authheader = process.env.GH_TOKEN && {
    Authorization: `token ${process.env.GH_TOKEN}`,
  }

  let url =
    `https://api.github.com/repos/${GH_USER_REPO}/issues?` +
    new URLSearchParams({
      state: 'all',
      labels: label,
      per_page: '100',
    })

  // pull issues created by owner only if allowed author = repo owner
  if (
    APPROVED_POSTERS_GH_USERNAME.length === 1 &&
    APPROVED_POSTERS_GH_USERNAME[0] === REPO_OWNER
  ) {
    url += '&' + new URLSearchParams({ creator: REPO_OWNER })
  }

  do {
    const res = await fetch(next?.url ?? url, {
      headers: authheader,
    })

    const issues = await res.json()
    if ('message' in issues && res.status > 400)
      throw new Error(
        res.status + ' ' + res.statusText + '\n' + (issues && issues.message)
      )

    issues.forEach((issue) => {
      if (APPROVED_POSTERS_GH_USERNAME.includes(issue.user.login)) {
        allContentWithLabel.push(parseIssue(issue, label))
      }
    })
    const headers = parse(res.headers.get('Link'))
    next = headers && headers.next
  } while (next)

  allContentWithLabel.sort((a, b) => b.date.valueOf() - a.date.valueOf()) // use valueOf to make TS happy https://stackoverflow.com/a/60688789/1106414
  return allContentWithLabel
}

// searches the list of content returned and matches based on slug
export async function getContent(fetch, slug) {
  // get all posts if not already done - or in development
  if (dev || allPosts.length === 0) {
    console.log('loading allPosts')
    allBlogposts = await listContentFromIssues(fetch, 'Published')
    allGalleries = await listContentFromIssues(fetch, 'Gallery')
    allPosts = [...allBlogposts, ...allGalleries]
    console.log('loaded ' + allBlogposts.length + ' blogposts')
    console.log('loaded ' + allGalleries.length + ' galleries')
    console.log('loaded ' + allPosts.length + ' posts from issues')

    if (!allPosts.length)
      throw new Error(
        'failed to load posts from github issues for some reason. check token' +
          process.env.GH_TOKEN
      )
  }
  if (!allPosts.length) throw new Error('no posts')
  // find the issue that matches this slug
  const post = allPosts.find((p) => p.slug === slug)
  if (post) {
    const content = await formatContent(post.content)

    return { ...post, content }
  } else {
    throw new Error('Issue not found for slug: ' + slug)
  }
}

// format github issue into object that page type expects.
// work pages are loaded using localContent.js for .svx files, not github issues
function parseIssue(issue, label) {
  const base = baseIssueContent(issue)
  const data = base.frontmatter

  let post

  switch (label) {
    case 'Gallery':
      post = {
        type: 'gallery',
        ...base,
        alt: data.alt,
        images: data.images,
        warn: data.warn || false
      }
      break
    case 'Published':
    default:
      let tags = []
      if (data.tags) tags = Array.isArray(data.tags) ? data.tags : [data.tags]
      tags = tags.map((tag) => tag.toLowerCase())

      post = {
        type: 'blog',
        ...base,
        category: data.category?.toLowerCase() || 'note',
        tags,
        readingTime: readingTime(base.content),
      }

      break
  }

  return post
}
