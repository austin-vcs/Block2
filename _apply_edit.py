path = "/Users/ab/Documents/vcs-ai-program/Block2/app/page.js"
src = open(path).read()
lines = src.split("\n")


def find_block(start_marker, end_marker, search_from=0):
    s = e = None
    for i in range(search_from, len(lines)):
        l = lines[i]
        if s is None and l.strip() == start_marker:
            s = i
        if s is not None and l.strip() == end_marker:
            e = i
            break
    return s, e


spinner = [
    "{/* While the API request is in flight, show a spinner plus a \"Thinking\"",
    '          message so the user knows the answer is being generated. */}',
    "{loading && (",
    "          <div",
    '          role="status"',
    '          aria-live="polite"',
    "          style={{",
    "            marginTop: '1.5rem',",
    "            display: 'flex',",
    "            alignItems: 'center',",
    "            gap: '0.75rem',",
    "            color: '#525252',",
    "            fontSize: '1rem',",
    "          }}",
    "          >",
    "            <span",
    '            aria-hidden="true"',
    "            style={{",
    "              display: 'inline-block',",
    "              width: '1.25rem',",
    "              height: '1.25rem',",
    "              border: '0.1875rem solid #d4d4d4',",
    "              borderTopColor: '#171717',",
    "              borderRadius: '50%',",
    "              animation: 'cc-spinner 0.8s linear infinite',",
    "              flexShrink: 0,",
    "            }}",
    "            />",
    "            <span>Thinking about your document...</span>",
    "          </div>",
    "        )}",
]

mdx = [
    "{/* Render the model's output as Markdown so **bold** becomes bold",
    "          text and bullet lists become real list items. Every component",
    "          keeps dark text on the light background so the answer stays readable. */}",
    "<Markdown",
    "          style={{ color: '#171717', fontSize: '1rem', lineHeight: 1.6 }}",
    "          components={{",
    "            p: (props) => (",
    "              <p style={{ color: '#171717', fontSize: '1rem', lineHeight: 1.6, margin: '0.5rem 0' }}>",
    "                {props.children}",
    "              </p>",
    "            ),",
    "            ul: (props) => (",
    "              <ul style={{ color: '#171717', paddingLeft: '1.25rem', margin: '0.5rem 0' }}>",
    "                {props.children}",
    "              </ul>",
    "            ),",
    "            ol: (props) => (",
    "              <ol style={{ color: '#171717', paddingLeft: '1.25rem', margin: '0.5rem 0' }}>",
    "                {props.children}",
    "              </ol>",
    "            ),",
    "            li: (props) => (",
    "              <li style={{ color: '#171717', fontSize: '1rem', lineHeight: 1.6, marginTop: '0.15rem' }}>",
    "                {props.children}",
    "              </li>",
    "            ),",
    "            strong: (props) => (",
    "              <strong style={{ fontWeight: 700, color: '#171717' }}>",
    "                {props.children}",
    "              </strong>",
    "            ),",
    "            a: (props) => (",
    "              <a href={props.href} style={{ color: '#171717', textDecoration: 'underline' }}>",
    "                {props.children}",
    "              </a>",
    "            ),",
    "          }}",
    "        >",
    "         {answer}",
    "        </Markdown>",
]

if "cc-spinner" not in src:
    s1, e1 = find_block("{loading && (", ")}")
    assert s1 is not None and e1 is not None, "loading block not found %s,%s" % (s1, e1)
    s2, e2 = find_block("<p", "</p>", search_from=e1 + 1)
    assert s2 is not None and e2 is not None, "answer block not found %s,%s" % (s2, e2)
    assert s2 > e1, "blocks out of order"
    new_lines = lines[: e1 + 1] + [""] + spinner + [""] + lines[s2:s2] + [""] + mdx + lines[e2 + 1:]
    open(path, "w").write("\n".join(new_lines))
    print("done: spinner + markdown applied")
else:
    print("already applied; skipping")
