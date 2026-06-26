import os
import re

directory = 'c:/Jahnavi Data/Fire_Extinguisher/src/components/Dashboard'
pattern = re.compile(
    r'\s*if\s*\(\!data\.items\s*\|\|\s*data\.items\.length\s*===\s*0\)\s*\{[^{}]*const\s*(mock|mockItems)\s*=\s*Array\.from\(\{.*?\}\)\.map\(.*?=>\s*\(\{.*?\}\)\);.*?(?:setListItems\((mock|mockItems)\);).*?(?:setListTotal\((mock|mockItems)\.length\);)\s*\}',
    re.DOTALL
)

for filename in os.listdir(directory):
    if filename.endswith('Stats.jsx'):
        filepath = os.path.join(directory, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # In case the regex misses some due to nested braces, we can use a simpler approach:
        # just find the start of the block and remove it carefully or use regex that balances braces.
        # Since the mock item blocks don't contain deeply nested braces (just the object), re.DOTALL with lazy match should work if we are careful.
        
        # Actually, since javascript regex is easier, let's just do a string replacement for the specific known pattern
        # Since the blocks vary slightly, let's use a robust regex:
        new_content = re.sub(
            r'\s*if\s*\(\!data\.items\s*\|\|\s*data\.items\.length\s*===\s*0\)\s*\{[^{}]*const\s*(?:mock|mockItems)\s*=\s*Array\.from.*?(?:setListItems\([a-zA-Z]+\);).*?(?:setListTotal\([a-zA-Z]+\.length\);)\s*\}',
            '',
            content,
            flags=re.DOTALL
        )
        
        # Just to be safe, maybe there's a better way. Let's try matching `if (!data.items || data.items.length === 0)` up to the next `catch {`
        # Actually, the block is always inside `try { ... } catch { ... }`
        new_content = re.sub(
            r'if \(!data\.items \|\| data\.items\.length === 0\) \{\s+const (?:mock|mockItems) = Array\.from\(\{ length: \d+ \}\)\.map\(\(_, i\) => \(\{\s+(?:.*?)\s+\}\)\);\s+setListItems\((?:mock|mockItems)\);\s+setListTotal\((?:mock|mockItems)\.length\);\s+\}',
            '',
            content,
            flags=re.DOTALL
        )
        
        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated {filename}")
