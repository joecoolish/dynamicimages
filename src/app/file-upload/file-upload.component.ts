import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  HostListener
} from '@angular/core';
import { FileService } from '../file.service';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css']
})
export class FileUploadComponent implements OnInit {
  errors: Array<string> = [];
  dragAreaClass = 'dragarea';
  @Input()
  projectId = 0;
  @Input()
  sectionId = 0;
  @Input()
  fileExt = 'JPG, GIF, PNG';
  @Input()
  maxFiles = 50;
  @Input()
  maxSize = 50; // 50MB
  @Output()
  uploadStatus = new EventEmitter();

  @HostListener('dragover', ['$event'])
  onDragOver(event) {
    this.dragAreaClass = 'droparea';

    event.preventDefault();
  }

  @HostListener('dragenter', ['$event'])
  onDragEnter(event) {
    this.dragAreaClass = 'droparea';

    event.preventDefault();
  }

  @HostListener('dragend', ['$event'])
  onDragEnd(event) {
    this.dragAreaClass = 'dragarea';

    event.preventDefault();
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(event) {
    this.dragAreaClass = 'dragarea';

    event.preventDefault();
  }

  @HostListener('drop', ['$event'])
  onDrop(event) {
    this.dragAreaClass = 'dragarea';

    event.preventDefault();

    event.stopPropagation();

    const files = event.dataTransfer.files;

    this.saveFiles(files);
  }

  constructor(private fileService: FileService) {}

  ngOnInit() {}

  onFileChange(event) {
    const files = event.target.files;
    this.saveFiles(files);
  }

  saveFiles(files) {
    this.errors = []; // Clear error
    // Validate file size and allowed extensions
    if (files.length > 0 && !this.isValidFiles(files)) {
      this.uploadStatus.emit(false);
      return;
    }
    if (files.length > 0) {
      const formData: FormData = new FormData();
      for (let j = 0; j < files.length; j++) {
        formData.append('file[]', files[j], files[j].name);
      }

      this.fileService.upload(formData).subscribe(
        success => {
          this.uploadStatus.emit(true);
          console.log(success);
        },
        error => {
          this.uploadStatus.emit(true);
          this.errors.push(error.ExceptionMessage);
        }
      );
    }
  }

  private isValidFiles(files) {
    // Check Number of files
    if (files.length > this.maxFiles) {
      this.errors.push(
        'Error: At a time you can upload only ' + this.maxFiles + ' files'
      );
      return;
    }

    this.isValidFileExtension(files);
    return this.errors.length === 0;
  }

  private isValidFileExtension(files) {
    // Make array of file extensions
    const extensions = this.fileExt.split(',').map(function(x) {
      return x.toLocaleUpperCase().trim();
    });
    for (let i = 0; i < files.length; i++) {
      // Get file extension
      const ext =
        files[i].name
          .toUpperCase()
          .split('.')
          .pop() || files[i].name;
      // Check the extension exists
      const exists = extensions.includes(ext);
      if (!exists) {
        this.errors.push('Error (Extension): ' + files[i].name);
      }
      // Check file size
      this.isValidFileSize(files[i]);
    }
  }

  private isValidFileSize(file) {
    const fileSizeinMB = file.size / (1024 * 1000);
    const size = Math.round(fileSizeinMB * 100) / 100; // convert upto 2 decimal place
    if (size > this.maxSize) {
      this.errors.push(
        'Error (File Size): ' +
          file.name +
          ': exceed file size limit of ' +
          this.maxSize +
          'MB ( ' +
          size +
          'MB )'
      );
    }
  }
}
