"""Check that the skill package ships the files its readers and gallery need."""
from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]

def validate():
    skill = (ROOT / 'SKILL.md').read_text(encoding='utf-8')
    assert skill.startswith('---\n'), 'SKILL.md needs YAML frontmatter'
    front = skill.split('---', 2)[1]
    assert re.search(r'^name: logo-to-stickers$', front, re.M), 'Wrong skill name'
    assert re.search(r'^description: .+', front, re.M), 'Missing skill description'
    count = 0
    for doc in list(ROOT.glob('*.md')) + list((ROOT / 'references').glob('*.md')):
        text = doc.read_text(encoding='utf-8')
        assert '/Users/' not in text, f'Host-specific path in {doc.name}'
        for target in re.findall(r'\]\(([^)]+)\)', text):
            if target.startswith(('http:', 'https:', '#', 'mailto:')):
                continue
            target = target.split('#')[0]
            assert (doc.parent / target).is_file(), f'Broken link: {doc.name} → {target}'
            count += 1
    gallery = json.loads((ROOT / 'docs/gallery.json').read_text(encoding='utf-8'))
    seen = set()
    for brand in gallery:
        assert (ROOT / 'docs' / brand['logo']).is_file(), brand['logo']
        assert brand['scenes'], f'Empty series: {brand["id"]}'
        for scene in brand['scenes']:
            assert (ROOT / 'docs' / scene['image']).is_file(), scene['image']
            assert scene['image'] not in seen, f'Duplicate artwork: {scene["image"]}'
            assert scene['title'] and scene['description'] and scene['alt']
            seen.add(scene['image'])
    prompts = json.loads((ROOT / 'examples/prompts.json').read_text(encoding='utf-8'))
    for item in prompts['items']:
        assert (ROOT / item['image']).is_file(), item['image']
        assert item['prompt'] and item['story']
        for reference in item['referenceOrder']:
            assert (ROOT / reference).is_file(), reference
    assert len(prompts['items']) == len(seen), 'Every example needs its run record'
    print(f'PASS: skill metadata, {count} local links, {len(gallery)} brands, {len(seen)} example assets and prompts')

if __name__ == '__main__':
    try:
        validate()
    except (AssertionError, OSError, KeyError, ValueError) as error:
        print(f'FAIL: {error}', file=sys.stderr)
        sys.exit(1)
