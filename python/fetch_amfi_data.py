# python/get_funds.py
import json
from mftool import Mftool

mf = Mftool()
all_funds = mf.get_scheme_codes()
print(json.dumps(all_funds))
