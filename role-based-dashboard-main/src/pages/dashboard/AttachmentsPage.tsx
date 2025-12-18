import { Button } from '@/components/ui/button';
import { Upload, Search, FileText, Image, File, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';

const AttachmentsPage = () => {
  const mockAttachments = [
    { id: '1', filename: 'requirements.pdf', task: 'API integration testing', uploadedBy: 'mgr001', uploadedAt: '2024-12-10', size: '2.4 MB', type: 'pdf' },
    { id: '2', filename: 'mockup-v2.png', task: 'Design dashboard layout', uploadedBy: 'dev002', uploadedAt: '2024-12-08', size: '1.8 MB', type: 'image' },
    { id: '3', filename: 'notes.txt', task: 'Documentation update', uploadedBy: 'dev001', uploadedAt: '2024-12-05', size: '12 KB', type: 'text' },
    { id: '4', filename: 'test-results.xlsx', task: 'Performance optimization', uploadedBy: 'mgr001', uploadedAt: '2024-12-12', size: '856 KB', type: 'file' },
  ];

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-destructive" />;
      case 'image':
        return <Image className="w-5 h-5 text-primary" />;
      case 'text':
        return <FileText className="w-5 h-5 text-muted-foreground" />;
      default:
        return <File className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Attachments</h1>
          <p className="text-muted-foreground">Task file attachments and documents</p>
        </div>
        <Button variant="glow">
          <Upload className="w-4 h-4" />
          Upload File
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search files..." className="pl-10" />
        </div>
      </div>

      {/* File Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
        {mockAttachments.map((file) => (
          <div 
            key={file.id} 
            className="gradient-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all duration-200 group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                {getFileIcon(file.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground truncate mb-1">{file.filename}</h3>
                <p className="text-sm text-muted-foreground truncate mb-2">{file.task}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{file.size}</span>
                  <span>•</span>
                  <span>{file.uploadedAt}</span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttachmentsPage;
