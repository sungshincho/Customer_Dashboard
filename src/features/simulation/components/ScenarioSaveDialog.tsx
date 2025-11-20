import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save } from 'lucide-react';

interface ScenarioSaveDialogProps {
  onSave: (name: string, description?: string) => void | Promise<void>;
  defaultName?: string;
  defaultDescription?: string;
  trigger?: React.ReactNode;
  isSaving?: boolean;
}

export function ScenarioSaveDialog({
  onSave,
  defaultName = '',
  defaultDescription = '',
  trigger,
  isSaving = false,
}: ScenarioSaveDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(defaultName);
  const [description, setDescription] = useState(defaultDescription);

  const handleSave = async () => {
    if (!name.trim()) return;

    await onSave(name, description);
    setOpen(false);
    setName('');
    setDescription('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Save className="w-4 h-4" />
            시나리오 저장
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>시나리오 저장</DialogTitle>
          <DialogDescription>
            시뮬레이션 시나리오를 저장하여 나중에 다시 불러올 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">시나리오 이름 *</Label>
            <Input
              id="name"
              placeholder="예: 2024 봄 레이아웃 변경안"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              placeholder="시나리오에 대한 간단한 설명을 입력하세요..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || isSaving}>
            {isSaving ? '저장 중...' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
