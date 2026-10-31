# -*- coding: utf-8 -*-
"""给教程卡片追加分类。

用法：
    python tools/tag.py <分类> <标题1> [标题2 ...] [--remove]

- 分类代号：weiyue / brio / ana / filter / ps / other
- 已存在的分类不会重复添加，也不会覆盖其他分类
- 加 --remove 表示从这些卡片上移除该分类
- 标题按卡片里的 <h3 class="tut-card__title"> 精确匹配
"""
import re
import sys

PATH = r"D:\工作-dk\tutorials.html"
CARDS = re.compile(r'(?s)<a class="tut-card"[^>]*>.*?</a>')


def main():
    args = [a for a in sys.argv[1:] if a != "--remove"]
    remove = "--remove" in sys.argv
    if len(args) < 2:
        print(__doc__)
        return

    cat, titles = args[0], args[1:]
    html = open(PATH, encoding="utf-8").read()

    done, missed = [], []
    for title in titles:
        found = False
        for m in CARDS.finditer(html):
            block = m.group(0)
            t = re.search(r'<h3 class="tut-card__title">(.*?)</h3>', block)
            if not t or t.group(1).strip() != title.strip():
                continue
            found = True
            cats = [c for c in re.search(r'data-cat="([^"]*)"', block).group(1).split() if c]
            if remove:
                cats = [c for c in cats if c != cat]
            elif cat not in cats:
                cats.append(cat)
            new_block = re.sub(r'data-cat="[^"]*"', 'data-cat="%s"' % " ".join(cats), block, count=1)
            html = html[: m.start()] + new_block + html[m.end():]
            break
        (done if found else missed).append(title)

    open(PATH, "w", encoding="utf-8").write(html)
    print("已处理：", len(done))
    for t in done:
        print("  ✓", t)
    if missed:
        print("没找到：")
        for t in missed:
            print("  ✗", t)


main()
