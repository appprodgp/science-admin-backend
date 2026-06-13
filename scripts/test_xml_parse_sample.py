from __future__ import annotations

import json
import sys
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.services.xml_parser_service import parse_jats_xml


SAMPLE_XML = """
<article>
  <front>
    <article-meta>
      <abstract><p>This is a concise sample abstract.</p></abstract>
    </article-meta>
  </front>
  <body>
    <sec>
      <title>Introduction</title>
      <p>This study introduces the problem.</p>
    </sec>
    <sec>
      <title>Materials and Methods</title>
      <p>Researchers collected a small sample and analyzed it.</p>
    </sec>
    <sec>
      <title>Results</title>
      <p>The sample results were clear.</p>
      <fig>
        <label>Figure 1</label>
        <caption><p>Overview of the sample workflow.</p></caption>
      </fig>
    </sec>
    <sec>
      <title>Discussion</title>
      <p>The finding is discussed without overstatement.</p>
    </sec>
  </body>
  <back>
    <ref-list><title>References</title><ref>Reference text should not be included.</ref></ref-list>
  </back>
</article>
"""


def main() -> None:
    parsed = parse_jats_xml(SAMPLE_XML)
    print(json.dumps(parsed, indent=2))


if __name__ == "__main__":
    main()