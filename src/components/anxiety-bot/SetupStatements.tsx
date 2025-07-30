import { Button } from "@/components/ui/button";

interface SetupStatementsProps {
  statements: string[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

const SetupStatements = ({ statements, selectedIndex, onSelect }: SetupStatementsProps) => {
  if (!statements?.length) return null;

  return (
    <div className="space-y-3 mt-4">
      <p className="font-medium text-sm">Choose your setup statement:</p>
      {statements.map((statement, index) => (
        <Button
          key={index}
          variant={selectedIndex === index ? "default" : "outline"}
          className="w-full text-left h-auto p-4 whitespace-normal"
          onClick={() => onSelect(index)}
        >
          {statement}
        </Button>
      ))}
    </div>
  );
};

export default SetupStatements;