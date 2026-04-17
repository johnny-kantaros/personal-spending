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
    <div className="flex-1">
      <label className="text-sm font-medium text-[#2D2A27] dark:text-[#E6EAF0] mb-2 block">
        Filter by Bank
      </label>
      <div className="flex flex-wrap gap-2">
        {banks.length === 0 ? (
          <p className="text-[#8A837C] dark:text-[#938a87]">No connected banks</p>
        ) : (
          banks.map((bank) => {
            const isSelected = selectedBanks.includes(bank.id);
            return (
              <label
                key={bank.id}
                className={`
                  flex items-center space-x-2 cursor-pointer px-3 py-1.5 rounded-md border transition-colors duration-150
                  ${
                    isSelected
                      ? "bg-[#6B8CAE] dark:bg-[#7A9FBF] border-[#6B8CAE] dark:border-[#7A9FBF] text-white"
                      : "bg-[#FDFCFA] dark:bg-[#2a2a2a] border-[#D8D5D0] dark:border-[#363636] text-[#2D2A27] dark:text-[#E6EAF0] hover:border-[#6B8CAE] dark:hover:border-[#7A9FBF]"
                  }
                `}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={isSelected}
                  onChange={() => toggleBank(bank.id)}
                />
                <span className="text-sm">{bank.institution_name}</span>
                {isSelected && (
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
