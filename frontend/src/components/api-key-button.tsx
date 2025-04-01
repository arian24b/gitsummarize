import { Key } from "lucide-react";
import { Button } from "./ui/button";

interface ApiKeyButtonProps {
  onClick: () => void;
}

export function ApiKeyButton({ onClick }: ApiKeyButtonProps) {
  return (
    <Button
      onClick={onClick}
      className="border-[3px] border-black bg-green-400 px-4 py-2 text-black shadow-[4px_4px_0_0_#000000] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-green-400"
    >
      <Key className="mr-2 h-5 w-5" />
      Use Your API Key
    </Button>
  );
}
