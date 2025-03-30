from collections import defaultdict
from enum import StrEnum
import itertools


class KeyGroup(StrEnum):
    OPENAI = "openai"
    GEMINI = "gemini"


class KeyManager:
    def __init__(self):
        self.keys = defaultdict(list)
        self.iterators = {}

    def add_key(self, group: KeyGroup, key: str):
        self.keys[group].append(key)
        self.iterators[group] = itertools.cycle(self.keys[group])

    def get_key(self, group: KeyGroup) -> str:
        return next(self.iterators[group])
