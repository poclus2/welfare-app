import re

def fix_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    # Remove phosphor weight props
    content = re.sub(r'\s+weight="(light|fill|bold|regular|thin|duotone)"', '', content)
    # Fix EyeSlash -> EyeOff
    content = content.replace('EyeSlash', 'EyeOff')
    # Fix FloppyDisk -> Save
    content = content.replace('FloppyDisk', 'Save')
    # Fix MagnifyingGlass -> Search (already done in import but just in case JSX)
    content = content.replace('MagnifyingGlass', 'Search')
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('Fixed: ' + path)

fix_file('apps/admin/app/dashboard/blog/BlogClient.tsx')
fix_file('apps/admin/app/dashboard/blog/ArticleEditor.tsx')
print('Done')
