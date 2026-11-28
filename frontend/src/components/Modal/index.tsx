import React, { useEffect, useState, ReactNode } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    className?: string;
    overlayClassName?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, className, overlayClassName }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        setIsModalOpen(isOpen);
    }, [isOpen]);

    return (
        <>
            {isModalOpen && (
                <div className="fixed inset-0 z-[9999] grid place-items-center p-3 md:p-6 overflow-y-auto">
                    {/* Overlay */}
                    <div
                        className={`fixed inset-0 ${overlayClassName || "bg-black/40 dark:bg-black/70 backdrop-blur-sm"} transition-opacity`}
                        onClick={onClose}
                    />

                    {/* Modal Content */}
                    <div
                        className={
                            className ||
                            "bg-white dark:bg-[#16181E] text-gray-800 dark:text-gray-100 border border-transparent dark:border-white/[0.08] p-5 relative z-50 rounded-2xl w-4/5 md:w-auto shadow-2xl transition-colors duration-200"
                        }
                        onClick={(e) => e.stopPropagation()} // prevents modal click from propagating
                    >
                        {children}
                    </div>
                </div>
            )}
        </>
    );
};

export default Modal;
