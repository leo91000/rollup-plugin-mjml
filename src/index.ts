import { createFilter } from '@rollup/pluginutils'
import type { Plugin } from 'rollup'
import type { FilterPattern } from '@rollup/pluginutils'
import mjml2html from 'mjml'

export type Mjml2HtmlOtps = NonNullable<Parameters<typeof mjml2html>[1]>
export type MjmlResult = ReturnType<typeof mjml2html>

export interface PluginOptions extends Mjml2HtmlOtps {
  include?: FilterPattern
  exclude?: FilterPattern
  mjmlOpts?: Mjml2HtmlOtps | ((id: string) => Mjml2HtmlOtps | undefined)
}

export function rollupPluginMjml({ include, exclude, mjmlOpts }: PluginOptions): Plugin {
  const filter = createFilter(include, exclude)

  return {
    name: 'uint8-array',
    async transform(code, id) {
      if (!filter(id))
        return null

      let options: Mjml2HtmlOtps | undefined
      if (typeof mjmlOpts === 'function')
        options = mjmlOpts(id)
      else
        options = mjmlOpts

      function mjmlErrorMessage(error: MjmlResult['errors'][number]) {
        return `Line ${error.line} of ${id} (${error.tagName}) - ${error.message}`
      }

      try {
        const htmlOutput = mjml2html(code, options)
        return {
          code: `export default ${JSON.stringify(htmlOutput)}`,
          map: { mappings: '' },
        }
      }
      catch (err) {
        const e = err as MjmlResult & { message: string }
        e.errors.map(error => error.formattedMessage = mjmlErrorMessage(error))
        e.message = e.errors[0].formattedMessage
        this.error(e)
      }
    },
  }
}
