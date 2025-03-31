from abc import ABC, abstractmethod


class AIBaseClient(ABC):
    @abstractmethod
    def get_business_summary(self, prompt: str) -> str:
        pass

    @abstractmethod
    def get_technical_documentation(self, prompt: str) -> str:
        pass
    
    def _truncate_text(self, text: str, max_tokens: int, multiplier: float = 3.7) -> str:
        return text[: int(max_tokens * multiplier)]