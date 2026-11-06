"""A small place for ideas to grow."""
from dataclasses import dataclass

@dataclass
class Companion:
    name: str
    energy: int = 88

    def greet(self, studio: str = "CyberStudios") -> str:
        # Strings, types, numbers, comments, and formatted expressions.
        return f"{self.name} is exploring {studio}: {self.energy / 100:.0%} energy"

if __name__ == "__main__":
    print(Companion("Byte").greet())
