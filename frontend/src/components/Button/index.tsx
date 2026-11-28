import React, { useState} from 'react';
import { ButtonProps,ToggleBtnProps } from '@app-types/components';

export const inputClass = `border border-gray-400 dark:border-white/[0.12] rounded-md py-1 px-3 text-sm 
  bg-gray-50 dark:bg-[#1B1E26] text-gray-700 dark:text-gray-100
  disabled:bg-gray-200 dark:disabled:bg-white/[0.05] disabled:text-gray-500 disabled:border-gray-200 disabled:cursor-not-allowed
  focus:outline-none focus:ring-2 focus:ring-[#FF5722]/30 focus:border-[#FF5722]
  shadow-sm placeholder-gray-400 dark:placeholder-gray-500`;
export const inputRegister = `
  w-full
  border border-gray-300 dark:border-white/[0.12] rounded-xl px-4 py-2 text-sm
  bg-white dark:bg-[#1B1E26] text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
  disabled:bg-gray-100 dark:disabled:bg-white/[0.05] disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed
  focus:outline-none focus:ring-2 focus:ring-[#FF5722]/30 focus:border-[#FF5722]
  transition-all duration-200
  shadow-sm
  hover:border-[#FF5722]/60
`;


export const PrimaryBtn: React.FC<ButtonProps> = ({
  label,
  onClick,
  type = "button",
  className = "",
  disabled = false,
}) => {
  return (
    <button
      onClick={onClick}
      type={type}
      disabled={disabled}
      className={`
        flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-bold
        bg-gradient-to-r from-[#FF5722] to-[#FF6B00] 
        text-white rounded-xl shadow-[0_4px_14px_rgba(255,87,34,0.35)] transition-all
        hover:from-[#FF7043] hover:to-[#FF5722] hover:shadow-[0_6px_20px_rgba(255,87,34,0.45)]
        active:scale-95 cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:scale-100 disabled:pointer-events-none
        ${className}
      `}
    >
      {label}
    </button>
  );
};

export const XMLButton: React.FC<ButtonProps> = ({
  label,
  onClick,
  type = "button",
  className = "",
  disabled = false,
}) => {
  return (
    <button
      onClick={onClick}
      type={type}
      disabled={disabled}
      className={`
        flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold
        bg-[#FF5722]/10 text-[#FF5722] border border-[#FF5722]/30 rounded-xl shadow-sm
        hover:bg-[#FF5722]/15 hover:border-[#FF5722]/50 transition-all cursor-pointer
        disabled:bg-gray-200 disabled:text-gray-400 disabled:border-transparent disabled:cursor-not-allowed
        ${className}
      `}
    >
      {label}
    </button>
  );
};

export const OrangeSpinner: React.FC<{ size?: number }> = ({ size = 24 }) => {
  return (
    <div
      className="animate-spin rounded-full border-t-4 border-b-4 border-[#FF5722] border-opacity-30"
      style={{
        width: size,
        height: size,
        borderTopColor: '#FF5722', // ReNote brand orange
        borderBottomColor: 'transparent',
      }}
    />
  );
};


export const ToolbarIconButton: React.FC<{
  Cmd: any;
  Icon?: React.ElementType;
}> = ({ Cmd, Icon }) => {
  return (
    <div className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer">
      {Icon ? (
        <button
          onClick={(e) => {
            e.preventDefault();
            document.execCommand(Cmd); // for align buttons
          }}
          className="w-5 h-5 flex items-center justify-center text-gray-700 dark:text-gray-200"
        >
          <Icon className="w-[18px] h-[18px] stroke-[2]" />
        </button>
      ) : (
        <Cmd className="w-[18px] h-[18px] stroke-[2] text-[12px] md:text-[10px] text-gray-700 dark:text-gray-200" />
      )}
    </div>
  );
};


export const SecondaryBtn: React.FC<ButtonProps> = ({
  label,
  onClick,
  type = "button",
  className = "",
  disabled = false,
}) => {
  return (
    <button
      onClick={onClick}
      type={type}
      disabled={disabled}
      className={`hover:bg-gray-100 dark:hover:bg-white/[0.08] text-gray-700 dark:text-gray-200 border border-gray-400 dark:border-white/[0.1] rounded-xl py-1.5 px-3 text-sm 
        bg-white dark:bg-[#1B1E26] shadow-sm transition-all
        disabled:bg-gray-200 dark:disabled:bg-white/[0.04] disabled:text-gray-500 dark:disabled:text-gray-600 disabled:border-gray-200 dark:disabled:border-white/[0.05] disabled:cursor-not-allowed
        ${className}`}
    >
      {label}
    </button>
  );
};


export const IconBtn: React.FC<ButtonProps> = ({ label, onClick, type = "button", className = "", disabled = false }) => {
  return (
    <button
      onClick={onClick}
      type={type}
      disabled={disabled}
      className={`flex items-center justify-center min-w-[38px] min-h-[38px] hover:bg-gray-100 dark:hover:bg-white/[0.08] text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-white/[0.1] bg-white dark:bg-[#1B1E26] rounded-xl p-2 transition-all shadow-sm cursor-pointer [&>svg]:w-5 [&>svg]:h-5 [&>svg]:stroke-[2] ${className}
      disabled:bg-gray-200 dark:disabled:bg-white/[0.04] disabled:text-gray-400 dark:disabled:text-gray-500 disabled:border-gray-200 dark:disabled:border-white/[0.05] disabled:cursor-not-allowed`}
    >
      {label}
    </button>
  );
};

export const ToggleBtn: React.FC<ToggleBtnProps> = ({
  label,
  value,
  onTrue,
  onFalse,
  className = "",
  disabled = false,
}) => {
  const [internalState, setInternalState] = useState(false);
  const isOn = value !== undefined ? value : internalState; // controlled or fallback to internal

  const handleToggle = () => {
    const newState = !isOn;

    if (value === undefined) {
      setInternalState(newState); // only update if uncontrolled
    }

    if (newState) onTrue?.();
    else onFalse?.();
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label
        className={`relative inline-flex items-center cursor-pointer ${disabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
      >
        <input
          type="checkbox"
          className="sr-only peer"
          checked={isOn}
          onChange={handleToggle}
          disabled={disabled}
        />
        {/* Track */}
        <div
          className={`
            w-6 h-3 md:w-10 md:h-5 rounded-full transition-colors duration-300 
            ${isOn ? "bg-[#FF5722]" : "bg-gray-300 dark:bg-gray-700"} 
            peer-focus:ring-2 peer-focus:ring-[#FF5722]/40
          `}
        >
          {/* Knob */}
          <div
            className={`
              absolute top-0.5 left-0.5 w-2 h-2 md:w-4 md:h-4 bg-white rounded-full 
              transition-transform duration-300 
              ${isOn ? "translate-x-2.5 md:translate-x-5" : ""}
            `}
          />
        </div>
      </label>
      {label && <span className="font-semibold text-gray-800 dark:text-gray-200">{label}</span>}
    </div>
  );
};
