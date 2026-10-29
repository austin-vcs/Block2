p = 'app/page.js'
with open(p) as f:
    s = f.read()

start_anchor = "<h2 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', color: '#171717' }}>"
i = s.index(start_anchor)
line_start = s.rfind('\n', 0, i) + 1

j = s.index("</Markdown>", i) + len("</Markdown>")
old_block = s[line_start:j]

new_block = (
     "\n" + " " * 13 + "<h2 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', color: '#171717' }}>\n"
     + " " * 15 + "{mode === 'Quiz Me' ? 'Quiz' : 'Answer'}\n"
     + " " * 13 + "</h2>\n"
     + " " * 13 + "{mode === 'Quiz Me' ? (\n"
     + " " * 15 + "// 'Quiz Me' results render as per-question cards, each with a\n"
     + " " * 15 + "// hidden 'Answer: X' line revealed by a 'Show answer' button.\n"
     + " " * 15 + "<QuizResults\n"
     + " " * 16 + "answer={answer}\n"
     + " " * 16 + "revealed={revealedQuiz}\n"
     + " " * 16 + "onToggle={(idx) =>\n"
     + " " * 17 + "setRevealedQuiz((prev) => ({ ...prev, [idx]: !prev[idx] }))\n"
     + " " * 16 + "}\n"
     + " " * 15 + "/>\n"
     + " " * 13 + ") : (\n"
     + " " * 15 + "// 'Ask a Question' and 'Summarize' keep the original plain\n"
     + " " * 15 + "// Markdown rendering, unchanged.\n"
     + " " * 15 + "<Markdown\n"
     + " " * 16 + "style={{ color: '#171717', fontSize: '1rem', lineHeight: 1.6 }}\n"
     + " " * 16 + "components={markdownComponents}\n"
     + " " * 15 + ">\n"
     + " " * 17 + "{answer}\n"
     + " " * 15 + "</Markdown>\n"
     + " " * 13 + ")}"
)

s = s[:line_start] + new_block + s[j:]
with open(p, 'w') as f:
    f.write(s)
print('done; replaced', len(old_block), 'chars')