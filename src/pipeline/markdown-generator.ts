import * as cheerio from 'cheerio';

export function htmlToMarkdown(html: string): string {
  const $ = cheerio.load(html, { xml: true });
  return convertNode($, $.root()).trim();
}

function convertNode($: cheerio.CheerioAPI, node: cheerio.Cheerio<cheerio.AnyNode>): string {
  let result = '';

  node.contents().each((_, child) => {
    if (child.type === 'text') {
      result += (child as unknown as { data: string }).data || '';
      return;
    }

    if (child.type !== 'tag') return;

    const el = $(child);
    const tag = (child as cheerio.Element).tagName?.toLowerCase();

    switch (tag) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6': {
        const level = parseInt(tag[1], 10);
        const prefix = '#'.repeat(level);
        const text = el.text().trim();
        result += `\n${prefix} ${text}\n\n`;
        break;
      }
      case 'p': {
        const text = convertNode($, el).trim();
        if (text) result += `${text}\n\n`;
        break;
      }
      case 'br':
        result += '\n';
        break;
      case 'hr':
        result += '\n---\n\n';
        break;
      case 'strong':
      case 'b': {
        const text = convertNode($, el);
        result += `**${text.trim()}**`;
        break;
      }
      case 'em':
      case 'i': {
        const text = convertNode($, el);
        result += `*${text.trim()}*`;
        break;
      }
      case 'a': {
        const text = el.text().trim();
        const href = el.attr('href') || '';
        result += href ? `[${text}](${href})` : text;
        break;
      }
      case 'ul':
        el.children('li').each((_, li) => {
          const text = convertNode($, $(li)).trim();
          result += `- ${text}\n`;
        });
        result += '\n';
        break;
      case 'ol':
        el.children('li').each((i, li) => {
          const text = convertNode($, $(li)).trim();
          result += `${i + 1}. ${text}\n`;
        });
        result += '\n';
        break;
      case 'blockquote': {
        const text = convertNode($, el).trim();
        const quoted = text
          .split('\n')
          .map((line) => `> ${line}`)
          .join('\n');
        result += `${quoted}\n\n`;
        break;
      }
      case 'pre': {
        const codeEl = el.find('code');
        const code = codeEl.length > 0 ? codeEl.text() : el.text();
        result += `\n\`\`\`\n${code}\n\`\`\`\n\n`;
        break;
      }
      case 'code': {
        // Inline code (not inside pre)
        if (!el.parent().is('pre')) {
          result += `\`${el.text()}\``;
        }
        break;
      }
      case 'table':
        result += convertTable($, el);
        break;
      case 'article':
      case 'section':
      case 'div':
      case 'span':
      case 'li':
        result += convertNode($, el);
        break;
      default:
        result += convertNode($, el);
        break;
    }
  });

  return result;
}

function convertTable($: cheerio.CheerioAPI, table: cheerio.Cheerio<cheerio.AnyNode>): string {
  const rows: string[][] = [];

  table.find('tr').each((_, tr) => {
    const cells: string[] = [];
    $(tr)
      .find('th, td')
      .each((_, cell) => {
        cells.push($(cell).text().trim());
      });
    rows.push(cells);
  });

  if (rows.length === 0) return '';

  const maxCols = Math.max(...rows.map((r) => r.length));

  // Normalize rows to same column count
  for (const row of rows) {
    while (row.length < maxCols) row.push('');
  }

  let md = '';
  // Header row
  md += '| ' + rows[0].join(' | ') + ' |\n';
  md += '| ' + rows[0].map(() => '---').join(' | ') + ' |\n';

  // Data rows
  for (let i = 1; i < rows.length; i++) {
    md += '| ' + rows[i].join(' | ') + ' |\n';
  }

  return md + '\n';
}
