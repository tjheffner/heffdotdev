<script lang="ts">
  import { CodeBlock } from '@hyzer-labs/ui'

  // Wraps one shiki-highlighted <pre> from markdown content in hyzer's
  // CodeBlock. It exists because CodeBlock takes its pre-highlighted markup
  // through a `children` snippet, and a snippet can't be constructed from
  // plain JS — so the attachment that mounts these needs a component to hand
  // the HTML to.
  let {
    code,
    language,
    html,
  }: { code: string; language?: string; html: string } = $props()

  // `text` is shiki's fallback for an unlabelled fence, and about a third of
  // the archive's fences have no language. A "text" chip is noise, so those
  // render chrome-less — CodeBlock still floats a copy button when there is
  // no header.
  let chip = $derived(language && language !== 'text' ? language : undefined)
</script>

<CodeBlock {code} language={chip}>{@html html}</CodeBlock>
