type CheckboxButtonProps = {
  label: string;
  selected: boolean;
  onClick: () => void;
  disabled: boolean;
};

export function CheckboxButton({ label, selected, onClick, disabled }: CheckboxButtonProps) {
  return (
    <button
      type="button"
      className={`
    px-5 py-3 rounded-xl font-semibold transition-all transform
    focus:outline-none focus:ring-4 focus:ring-blue-300
    ${
      selected
        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105 ring-2 ring-blue-400"
        : "backdrop-blur-md bg-white/60 text-gray-700 border border-gray-300 hover:scale-105 hover:shadow-md"
    }
    ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-95"}
  `}
      disabled={disabled}
      onClick={onClick}
      aria-pressed={selected}
    >
      {label}
    </button>
  );
}
