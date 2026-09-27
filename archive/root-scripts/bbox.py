import re
with open(r'C:\Users\LENOVO\Documents\Harestech\welfare-platform\Gemini_Generated_Image_9ns9hx9ns9hx9ns9.svg', 'r') as f:
    text = f.read()

paths = re.findall(r'<path d="([^"]+)"', text)
paths = [p.replace('\n', ' ') for p in paths]

min_x, min_y, max_x, max_y = float('inf'), float('inf'), float('-inf'), float('-inf')

for p in paths:
    tokens = re.split(r'([A-Za-z]+|\s+)', p)
    tokens = [t.strip() for t in tokens if t.strip()]
    
    curr_x, curr_y = 0, 0
    cmd = ''
    i = 0
    while i < len(tokens):
        if re.match(r'[A-Za-z]', tokens[i]):
            cmd = tokens[i]
            i += 1
            continue
            
        if cmd == 'M':
            curr_x = float(tokens[i])
            curr_y = float(tokens[i+1])
            min_x = min(min_x, curr_x)
            max_x = max(max_x, curr_x)
            min_y = min(min_y, curr_y)
            max_y = max(max_y, curr_y)
            i += 2
        elif cmd == 'm':
            curr_x += float(tokens[i])
            curr_y += float(tokens[i+1])
            min_x = min(min_x, curr_x)
            max_x = max(max_x, curr_x)
            min_y = min(min_y, curr_y)
            max_y = max(max_y, curr_y)
            i += 2
        elif cmd == 'c':
            curr_x += float(tokens[i+4])
            curr_y += float(tokens[i+5])
            min_x = min(min_x, curr_x)
            max_x = max(max_x, curr_x)
            min_y = min(min_y, curr_y)
            max_y = max(max_y, curr_y)
            i += 6
        elif cmd == 'l':
            curr_x += float(tokens[i])
            curr_y += float(tokens[i+1])
            min_x = min(min_x, curr_x)
            max_x = max(max_x, curr_x)
            min_y = min(min_y, curr_y)
            max_y = max(max_y, curr_y)
            i += 2
        elif cmd == 'z' or cmd == 'Z':
            i += 1
        else:
            i += 1

print(f'Raw minX={min_x}, maxX={max_x}, minY={min_y}, maxY={max_y}')
actual_min_x = min_x * 0.1
actual_max_x = max_x * 0.1
actual_min_y = 2048 - (max_y * 0.1)
actual_max_y = 2048 - (min_y * 0.1)
print(f'Actual minX={actual_min_x}, maxX={actual_max_x}, minY={actual_min_y}, maxY={actual_max_y}')
