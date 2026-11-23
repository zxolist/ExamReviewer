# -*- coding: utf-8 -*-
import re

with open('index.html', encoding='utf-8') as f:
    html = f.read()

with open('app.js', encoding='utf-8') as f:
    js = f.read()

ids = set(re.findall(r"getElementById\(['\"]([a-zA-Z0-9_-]+)['\"]\)", js))
missing = [i for i in ids if f'id="{i}"' not in html and f"id='{i}'" not in html]

print(f"Total unique IDs checked: {len(ids)}")
if missing:
    print("MISSING IDs:", missing)
else:
    print("SUCCESS: All IDs in app.js exist in index.html!")

classes = set(re.findall(r"querySelector(?:All)?\(['\"]\.([a-zA-Z0-9_-]+)['\"]\)", js))
print(f"Total classes checked: {len(classes)}")
missing_classes = [c for c in classes if f'class="{c}' not in html and f'class=\'{c}' not in html and f' {c}' not in html and f'"{c}' not in html]
print("Classes missing check:", missing_classes if missing_classes else "All querySelector classes found!")
