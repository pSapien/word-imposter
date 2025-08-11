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
    px-4 py-2 rounded-full border font-semibold transition
    focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1
    ${selected ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50"}
    ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
  `}
      disabled={disabled}
      onClick={onClick}
      aria-pressed={selected}
    >
      {label}
    </button>
  );
}
