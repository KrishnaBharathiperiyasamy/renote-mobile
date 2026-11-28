"use client";
import { useState, useEffect } from "react";
import Modal from "@components/Modal";
import { safeToastError } from "@utilis/toastHelper";
import { PrimaryBtn, SecondaryBtn } from "@components/Button";
import { API_ENDPOINTS } from "@constants/api";

interface TagModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (tags: string[]) => void;
    initialTags?: string[];
}

const TagModal: React.FC<TagModalProps> = ({ isOpen, onClose, onSave, initialTags }) => {
    const [tags, setTags] = useState<string[]>(initialTags || []);
    const [newTag, setNewTag] = useState<string>("");
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

    const newTagLimit = 5;

    useEffect(() => {
        const fetchExistingTags = async () => {
            try {
                const userId = localStorage.getItem("user_id");
                if (!userId) return;

                const response = await fetch(API_ENDPOINTS.POSTERS.TAGS(userId));
                const text = await response.text();

                const parsed = text
                    .replace(/[{}"]/g, "")
                    .split(",")
                    .map((t) => t.trim())
                    .filter((tag) => tag !== "");

                setSuggestions(parsed);
            } catch (err) {
                console.error("Error fetching tags", err);
            }
        };

        if (isOpen) {
            if (initialTags) setTags(initialTags);
            fetchExistingTags();
        }
    }, [isOpen, initialTags]);

    const filteredSuggestions = suggestions.filter(tag =>
        newTag.trim() === ""
            ? true
            : tag.toLowerCase().includes(newTag.toLowerCase())
    );

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (!(e.target as HTMLElement).closest(".tag-dropdown")) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener("click", handleClick);
        return () => document.removeEventListener("click", handleClick);
    }, []);


    const handleAddTag = (tagToAdd?: string) => {
        const trimmed = (tagToAdd || newTag).trim();
        if (!trimmed) return; // do nothing for empty input

        if (tags.includes(trimmed)) {
            safeToastError("Tag already added!");
            return;
        }

        if (tags.length >= newTagLimit) {
            safeToastError(`Only ${newTagLimit} tags can be added.`);
            return;
        }

        setTags([...tags, trimmed]);
        setNewTag("");
        setShowSuggestions(false);
    };

    const handleRemoveTag = (index: number) => {
        setTags(tags.filter((_, i) => i !== index));
    };
    
    const handleRemoveTagByName = (tagName: string) => {
        setTags(tags.filter(t => t !== tagName));
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="flex flex-col gap-4 w-full max-w-lg sm:max-w-md xs:max-w-sm p-4 sm:p-6 rounded-lg bg-white dark:bg-[#16181E] text-gray-900 dark:text-white animate-fadeIn shadow-xl">
                {/* Header */}
                <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Add Tags</h2>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Add up to {newTagLimit} tags to organize your poster</p>
                </div>

                <div className="relative w-full tag-dropdown">
                    {/* Tag Input Container */}
                    <div className="flex flex-wrap items-start gap-2 sm:gap-2.5 border-2 border-gray-200 dark:border-white/[0.12] rounded-lg p-2.5 sm:p-3 min-h-[48px] sm:min-h-[50px] focus-within:border-orange-400 focus-within:ring-1 focus-within:ring-orange-200 transition-all duration-200 bg-gray-50 dark:bg-[#1B1E26]">

                        {/* Tag Chips */}
                        {tags.map((tag, index) => (
                            <div 
                                key={index} 
                                className="flex items-center gap-1 sm:gap-1.5 bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-[13px] font-medium border border-orange-200 dark:border-orange-500/30 shadow-sm"
                            >
                                <span className="truncate max-w-[100px]">{tag}</span>
                                <button 
                                    onClick={() => handleRemoveTag(index)} 
                                    className="flex-shrink-0 text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-200 font-semibold text-lg leading-none hover:bg-orange-200/50 dark:hover:bg-orange-500/30 rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center transition-colors"
                                    title="Remove tag"
                                >
                                    ×
                                </button>
                            </div>
                        ))}

                        {/* Input Field */}
                        <input
                            value={newTag}
                            placeholder={tags.length >= newTagLimit ? "Max tags" : "Add tag..."}
                            disabled={tags.length >= newTagLimit}
                            onFocus={() => setShowSuggestions(true)}
                            onChange={(e) => {
                                setNewTag(e.target.value);
                                setShowSuggestions(true);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddTag();
                                }
                            }}
                            className="flex-1 min-w-[100px] sm:min-w-[140px] outline-none text-xs sm:text-sm p-1.5 sm:p-2 bg-transparent text-gray-700 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 disabled:text-gray-400 disabled:placeholder-gray-300"
                        />

                        {/* Add Button */}
                        {tags.length < newTagLimit && (
                            <button
                                type="button"
                                onClick={() => handleAddTag()}
                                disabled={!newTag.trim()}
                                className="flex-shrink-0 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white px-3 sm:px-4 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors shadow-sm"
                            >
                                Add
                            </button>
                        )}
                    </div>

                    {/* Suggestions Dropdown */}
                    {showSuggestions && filteredSuggestions.length > 0 && (
                        <div className="absolute bg-white dark:bg-[#181B26] border border-gray-200 dark:border-white/[0.1] shadow-lg mt-2 rounded-lg w-full max-h-36 sm:max-h-40 overflow-y-auto z-50 text-xs sm:text-sm">
                            {filteredSuggestions.map((s, index) => {
                                const isSelected = tags.includes(s);

                                return (
                                    <div
                                        key={index}
                                        className={`cursor-pointer px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between transition-colors ${
                                            isSelected 
                                                ? "bg-orange-50 dark:bg-orange-500/20 border-l-3 border-orange-400" 
                                                : "hover:bg-gray-50 dark:hover:bg-white/[0.05] border-l-3 border-transparent"
                                        }`}
                                        onClick={() =>
                                            isSelected ? handleRemoveTagByName(s) : handleAddTag(s)
                                        }
                                    >
                                        <span className={`truncate ${isSelected ? "text-orange-700 dark:text-orange-300 font-medium" : "text-gray-700 dark:text-gray-200"}`}>{s}</span>
                                        {isSelected && (
                                            <span className="flex-shrink-0 text-orange-500 font-bold text-base sm:text-lg ml-2">✓</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Tag Count */}
                <div className="text-xs text-gray-500 dark:text-gray-400">
                    Tags: <span className="font-semibold text-gray-700 dark:text-gray-200">{tags.length}</span>/<span>{newTagLimit}</span>
                </div>

                {/* Footer */}
                <div className="flex gap-2 sm:gap-3 pt-1 sm:pt-2">
                    <SecondaryBtn
                        label="Cancel"
                        onClick={onClose}
                        className="flex-1 px-3 py-2 sm:py-2.5 text-xs sm:text-sm"
                    />
                    <PrimaryBtn
                        label="Save Tags"
                        onClick={() => {
                            onSave(tags);
                            onClose();
                        }}
                        className="flex-1 px-3 py-2 sm:py-2.5 text-xs sm:text-sm"
                    />
                </div>
            </div>
        </Modal>
    );
};

export default TagModal;
