'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    isLoading?: boolean;
    showFirstLast?: boolean;
    maxVisiblePages?: number;
}

export default function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    isLoading = false,
    showFirstLast = true,
    maxVisiblePages = 7
}: PaginationProps) {
    const [inputValue, setInputValue] = useState(currentPage);

    useEffect(() => {
        setInputValue(currentPage);
    }, [currentPage]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Number(e.target.value);
        if (!isNaN(val)) setInputValue(val);
    };

    const handleInputSubmit = () => {
        const val = Math.max(1, Math.min(totalPages, inputValue));
        onPageChange(val);
    };

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            const leftOffset = Math.floor((maxVisiblePages - 3) / 2);
            const rightOffset = Math.ceil((maxVisiblePages - 3) / 2);

            let start = Math.max(2, currentPage - leftOffset);
            let end = Math.min(totalPages - 1, currentPage + rightOffset);

            if (currentPage <= leftOffset + 2) {
                start = 2;
                end = maxVisiblePages - 1;
            }

            if (currentPage >= totalPages - rightOffset - 1) {
                start = totalPages - maxVisiblePages + 2;
                end = totalPages - 1;
            }

            if (start > 2) pages.push('...');
            for (let i = start; i <= end; i++) pages.push(i);
            if (end < totalPages - 1) pages.push('...');
            pages.push(totalPages);
        }

        return pages;
    };

    const pageNumbers = getPageNumbers();
    const hasPrevPage = currentPage > 1;
    const hasNextPage = currentPage < totalPages;

    return (
        <nav className="isolate flex flex-col items-center space-y-2 mt-2" aria-label="Pagination">
            {/* Buttons Row */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
                {showFirstLast && (
                    <Button
                        onClick={() => onPageChange(1)}
                        disabled={!hasPrevPage || isLoading}
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        title="First page"
                        aria-label="Go to first page"
                    >
                        <ChevronsLeft className="h-4 w-4" />
                    </Button>
                )}

                <Button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={!hasPrevPage || isLoading}
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    title="Previous page"
                    aria-label="Go to previous page"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Page Buttons */}
                <div className="flex items-center gap-1 flex-wrap justify-center">
                    {pageNumbers.map((page, index) => {
                        if (page === '...') {
                            return (
                                <span
                                    key={`ellipsis-${index}`}
                                    className="px-2 text-gray-400 select-none"
                                    aria-hidden="true"
                                >
                                    ...
                                </span>
                            );
                        }

                        const pageNum = page as number;
                        const isActive = pageNum === currentPage;

                        return (
                            <Button
                                key={pageNum}
                                onClick={() => onPageChange(pageNum)}
                                disabled={isLoading}
                                variant={isActive ? 'default' : 'outline'}
                                size="icon"
                                className={`h-9 w-9 shrink-0 ${isActive
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
                                    : 'hover:bg-gray-800 border-gray-700'}`}
                                aria-label={`Go to page ${pageNum}`}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                {pageNum}
                            </Button>
                        );
                    })}
                </div>

                <Button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={!hasNextPage || isLoading}
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    title="Next page"
                    aria-label="Go to next page"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>

                {showFirstLast && (
                    <Button
                        onClick={() => onPageChange(totalPages)}
                        disabled={!hasNextPage || isLoading}
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        title="Last page"
                        aria-label="Go to last page"
                    >
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Page Input Row */}
            {totalPages > maxVisiblePages && (
                <div className="flex items-center gap-2 justify-center flex-wrap">
                    <input
                        type="number"
                        min={1}
                        max={totalPages}
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={(e) => e.key === 'Enter' && handleInputSubmit()}
                        className="w-16 text-white rounded border border-gray-700 px-2 py-1 text-sm"
                        aria-label="Enter page number"
                    />
                    <Button size="sm" onClick={handleInputSubmit}>
                        Go
                    </Button>
                    <span className="text-sm text-gray-400 select-none whitespace-nowrap">
                        of {totalPages.toLocaleString()}
                    </span>
                </div>
            )}
        </nav>
    );
}
