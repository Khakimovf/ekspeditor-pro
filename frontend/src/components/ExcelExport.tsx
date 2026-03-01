import React from 'react';
import * as XLSX from 'xlsx';
// lucide-react removed

export interface InventoryItem {
    id: string;
    name: string;
    perBox: number;
    currentStock: number;
    minLimit: number;
}

interface ExcelExportProps {
    inventory: InventoryItem[];
}

const ExcelExport: React.FC<ExcelExportProps> = ({ inventory }) => {
    const exportToExcel = () => {
        if (inventory.length === 0) {
            alert("Eksport qilish uchun zaxira mavjud emas");
            return;
        }

        const ws = XLSX.utils.json_to_sheet(
            inventory.map((item) => ({
                'ID': item.id,
                'Nomi': item.name,
                'Karobkadagi Soni (dona)': item.perBox,
                'Jami Zaxira (dona)': item.currentStock,
                'Ekvivalent Karobka': (item.currentStock / item.perBox).toFixed(1),
            }))
        );

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Joriy Zaxira');

        // Automatically size columns
        const wscols = [
            { wch: 15 }, // ID
            { wch: 30 }, // Nomi
            { wch: 25 }, // PerBox
            { wch: 20 }, // Total Pieces
            { wch: 20 }, // Eq Boxes
        ];
        ws['!cols'] = wscols;

        const fileName = `Joriy_Zaxira_Hisoboti_${new Date().toLocaleDateString('uz-UZ')}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    return (
        <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 dark:bg-indigo-700 text-white font-bold rounded-xl shadow-lg dark:shadow-none hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all duration-300 transform hover:scale-105 active:scale-95 whitespace-nowrap"
        >
            <span className="text-2xl">📥</span>
            <span>Excel Hisobot (Zaxira)</span>
        </button>
    );
};

export default ExcelExport;
