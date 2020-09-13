import { Component, OnInit, ViewChild, ElementRef, ViewEncapsulation } from "@angular/core";
import {
  FormGroup,
  FormBuilder,
  FormControl,
  Validators,
} from "@angular/forms";
import { ToastrService } from "ngx-toastr";
import { MatTooltipModule } from '@angular/material';

import { CronJob } from "../audit-list-cronjobs/audit-list-cronjobs-config";
import { AuditService } from "src/app/shared/services/audit/audit.service";
import { NgbModal, ModalDismissReasons } from "@ng-bootstrap/ng-bootstrap";
import { audit } from "rxjs/operators";

//import { ValidateRequiredSelect } from "./work-order-radio-config";

@Component({
  selector: "ui-audit-add-cronjob",
  templateUrl: "./audit-add-cronjob.component.html",
  styleUrls: ["./audit-add-cronjob.component.scss"],
  encapsulation: ViewEncapsulation.None,
  styles: [`
    .my-custom-class .tooltip-inner {
      background-color: grey;
      font-size: 110%;
      width: 170px;
      text-align: left;
    }
  `]
})
export class AuditAddCronjobComponent implements OnInit {
  @ViewChild("content") content: ElementRef;
  @ViewChild("contentReport") contentReport: ElementRef;
  cronjobAction: String = '';
  cronJobs: CronJob[] = [];
  cronJobFormGroup: FormGroup;
  cronJob: CronJob;
  action: String;
  pageNumber = 1;
  pages = 0;
  reportModalBody: String;
  reportModalHead: String;

  constructor(
    private formBuilder: FormBuilder,
    private cronJobService: AuditService,
    private toastr: ToastrService,
    private modalService: NgbModal
  ) { }

  ngOnInit() {
    this.initFormGroup();
    this.getCronJobs(this.pageNumber);
    console.log("hi\nhow you doing\n".replace("\n", "<br>"));
  }

  initFormGroup() {
    this.cronJobFormGroup = this.formBuilder.group({
      Minute: new FormControl(""),
      Hour: new FormControl(""),
      Day: new FormControl(""),
      Month: new FormControl(""),
      Weekday: new FormControl(""),
      Command: new FormControl(""),
      Type: new FormControl(0),
      MinuteSelect: new FormControl(0),
      HourSelect: new FormControl(0),
      DaySelect: new FormControl(0),
      MonthSelect: new FormControl(0),
      WeekdaySelect: new FormControl(0),
      convertedText: new FormControl({ value: "", disabled: true }),
      logFile: new FormControl(false),
      sendMail: new FormControl(false),
      Description: new FormControl(""),
    });
  }

  onSubmit(formGroup: FormGroup) {
    this.cronJobService
      .generateCronJob(this.createCronJob(formGroup)).subscribe(
        (data: CronJob) => {
          console.log(data);
          if (data[2] == true) {
            this.toastr.success(
              data[0]["command"] + data[3]
            );
            console.log(data);
            this.getCronJobs(this.pageNumber);
            formGroup.patchValue({
              Minute: "",
              Hour: "",
              Day: "",
              Month: "",
              Weekday: "",
              Command: "",
              Type: "",
              convertedText: "",
              Description: "",
              sendMail: 0,
              logFile: 0,
            });
          } else {
            this.toastr.error(data[3]);
          }
        },
        (error: any) => {
          this.toastr.error("An error occurred while scheduling your taks");
        }
      );
  }

  onClick(formGroup: FormGroup) {
    this.cronJobService.convertCronJob(this.createCronJob(formGroup)).subscribe(
      (data: CronJob) => {
        if (data["status"] == "ok") {
          this.toastr.success("Your Cron Job schedule is correct");
          console.log(data["converted_cron_job"]);
          this.cronJobFormGroup.patchValue({
            convertedText: data["converted_cron_job"],
          });
        } else {
          this.toastr.error("Please make you sure you entered the right format");
        }
      },
      (error: any) => {
        this.toastr.error("Please make you sure you entered the right format");
      }
    );
  }

  getCronJobs(pageNumber: number) {
    this.cronJobService.getCronJobs(pageNumber, 5).subscribe((page: any) => {
      this.cronJobs = page.items.data;
      this.pages = page.pages;
    });
  }

  createCronJob(formGroup: FormGroup): CronJob {
    const cronJob = new CronJob();
    cronJob.command = formGroup.get("Command").value;
    let minute = formGroup.get("Minute").value;
    let hour = formGroup.get("Hour").value;
    let day = formGroup.get("Day").value;
    let month = formGroup.get("Month").value;
    let weekDay = formGroup.get("Weekday").value;
    //console.log(formGroup.get("sendMail").value);
    //console.log(formGroup.get("logFile").value);
    cronJob.creationDate = new Date();
    cronJob.type = formGroup.get("Type").value;
    cronJob.expression = minute + " " + hour + " " + day + " " + month + " " + weekDay;
    cronJob.lastRun = new Date();
    cronJob.status = "";
    cronJob.nextRun = new Date();
    cronJob.description = formGroup.get("Description").value;
    cronJob.log = {
      'sendMail': formGroup.get("sendMail").value,
      'logFile': formGroup.get("logFile").value
    }
    console.log(cronJob)
    return cronJob;
  }

  onPageChange(page: number) {
    this.pageNumber = page;
    this.getCronJobs(this.pageNumber);
  }

  onActionClick(event: any) {
    switch (event.action) {
      case "RUN":
        this.cronJob = event.cronJob;
        this.action = event.action;
        this.openModalRun(this.content);
        this.getCronJobs(this.pageNumber);
        break;
      case "STOP":
        this.cronJob = event.cronJob;
        this.action = event.action;
        this.openModalStop(this.content);
        this.getCronJobs(this.pageNumber);
        break;
      case "HISTORY":
        this.cronJob = event.cronJob;
        this.action = event.action;
        this.cronJobService.getCronReport('history', this.cronJob.id).subscribe(
          (data: any) => {
            this.reportModalBody = data.file.replace(new RegExp("\n", 'g'), '<br>');
            console.log(this.reportModalBody);
            this.reportModalHead = 'History';
          }, error => {
            this.reportModalBody = "Data not found";
            this.reportModalHead = 'History';
            this.toastr.error('Data not found');
          });
        this.openModalReport();
        break;
      case "REPORT":
        this.cronJob = event.cronJob;
        this.action = event.action;
        this.cronJobService.getCronReport('report', this.cronJob.id).subscribe(
          (data: any) => {
            this.reportModalBody = data.file;
            this.reportModalHead = 'Report';
          }, error => {
            this.reportModalBody = "Data not found";
            this.reportModalHead = 'Report';
            this.toastr.error('Data not found');
          });
        this.openModalReport();
        break;
    }
  }

  openModalStop(content: any) {
    this.modalService
      .open(content, {
        ariaLabelledBy: "modal-basic-title",
        size: "lg",
        centered: true,
      })
      .result.then(
        (result) => {
          switch (result) {
            case "CANCEL":
              console.log("Canceled");

              break;
            case "CONFIRM":
              this.cronJobService.stopConJob(this.cronJob.id).subscribe(
                (data: any) => {
                  this.toastr.success(data.msg);
                }, error => {
                });
              this.getCronJobs(this.pageNumber);
              break;
            default:
              this.cronjobAction = '';
          }
        },
        (reason) => { }
      );

  }

  openModalRun(content: any) {
    this.modalService
      .open(content, {
        ariaLabelledBy: "modal-basic-title",
        size: "lg",
        centered: true,
      })
      .result.then(
        (result) => {
          switch (result) {
            case "CANCEL":
              console.log("Canceled");

              break;
            case "CONFIRM":
              this.cronJobService.activateConJob(this.cronJob.id).subscribe(
                (data: any) => {
                  this.toastr.success(data.msg);
                }, error => {
                });
              this.getCronJobs(this.pageNumber);
              break;
            default:
          }
        },
        (reason) => { }
      );
  }

  openModalReport() {
    this.modalService
      .open(this.contentReport, {
        ariaLabelledBy: "modal-basic-title",
        size: "lg",
        centered: true,
      });
  }

}
