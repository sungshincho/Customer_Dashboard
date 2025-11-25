import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download, FileText, FileSpreadsheet, FileDown } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

interface ExportButtonProps {
  data: any;
  filename: string;
  title: string;
}

export const ExportButton = ({ data, filename, title }: ExportButtonProps) => {
  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFont("helvetica");
      doc.setFontSize(16);
      doc.text(title, 20, 20);
      doc.setFontSize(12);
      doc.text(JSON.stringify(data, null, 2), 20, 40);
      doc.save(`${filename}.pdf`);
      toast.success("PDF 파일이 다운로드되었습니다");
    } catch (error) {
      toast.error("PDF 내보내기 실패");
    }
  };

  const exportToExcel = () => {
    try {
      const ws = XLSX.utils.json_to_sheet(Array.isArray(data) ? data : [data]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data");
      XLSX.writeFile(wb, `${filename}.xlsx`);
      toast.success("Excel 파일이 다운로드되었습니다");
    } catch (error) {
      toast.error("Excel 내보내기 실패");
    }
  };

  const exportToCSV = () => {
    try {
      const ws = XLSX.utils.json_to_sheet(Array.isArray(data) ? data : [data]);
      const csv = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}.csv`);
      link.click();
      toast.success("CSV 파일이 다운로드되었습니다");
    } catch (error) {
      toast.error("CSV 내보내기 실패");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          내보내기
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToPDF}>
          <FileText className="w-4 h-4 mr-2" />
          PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToExcel}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToCSV}>
          <FileDown className="w-4 h-4 mr-2" />
          CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
