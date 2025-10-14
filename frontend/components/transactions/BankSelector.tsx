"use client";

interface BankItem {
  id: string;
  institution_name: string;
}

interface Props {
  banks: BankItem[];
  selectedBanks: string[];
  onChange: (selected: string[]) => void;
}

export default function BankSelector({ banks, selectedBanks, onChange }: Props) {
  const toggleBank = (id: string) => {
    if (selectedBanks.includes(id)) {
      onChange(selectedBanks.filter((b) => b !== id));
    } else {
      onChange([...selectedBanks, id]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {banks.length === 0 ? (
        <p className="text-gray-400">No connected banks</p>
      ) : (
        banks.map((bank) => (
          <label
            key={bank.id}
            className="flex items-center space-x-2 cursor-pointer bg-white px-3 py-1 border rounded-lg shadow-sm hover:bg-gray-50 transition"
          >
            <input
              type="checkbox"
              className="w-4 h-4 accent-indigo-500"
              checked={selectedBanks.includes(bank.id)}
              onChange={() => toggleBank(bank.id)}
            />
            <span className="text-gray-800">{bank.institution_name}</span>
          </label>
        ))
      )}
    </div>
  );
}
