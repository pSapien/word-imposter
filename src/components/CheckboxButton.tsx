type CheckboxButtonProps = {
  label: string;
  selected: boolean;
  onClick: () => void;
  disabled: boolean;
};

export function CheckboxButton({ label, selected, onClick, disabled }: CheckboxButtonProps) {
  return (
    <button
      className={`px-4 py-1 rounded-full border ${selected ? "bg-blue-500 text-white" : "bg-white"}`}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
