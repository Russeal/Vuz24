import {Component, OnDestroy, OnInit} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';
import {LocalStorageSecurity} from '../../util/localStorageSecurity';
import {CommonKey} from '../../util/commonKey';
import {AdminNavPanelService} from './admin-nav-panel.service';
import {ProfileDetailDTO} from './dto/profileDetailDTO';
import {SharedToasterDTO} from '../../shared/shared-toaster/dto/sharedToasterDTO';
import {SharedToasterService} from '../../shared/shared-toaster/shared-toaster.service';
import {Subscription} from "rxjs";
import {ImageDto} from "../../dto/imageDto";

declare var $: any;

@Component({
  selector: 'app-admin-nav-panel',
  templateUrl: './admin-nav-panel.component.html',
  styleUrls: ['./admin-nav-panel.component.scss'],
  providers: [AdminNavPanelService]
})
export class AdminNavPanelComponent implements OnInit, OnDestroy {

  public selectedMenuKey: string;
  public firstName: string;
  public lastName: string;
  public pImgLink: string;

  public profileDTO: ProfileDetailDTO;
  public showErrMsg: boolean;
  public errMsg: string;

  public userRole: string;
  public profileImgSrc: any;
  /* Subscription */
  public routeChangeSubscription: Subscription;

  constructor(private router: Router, private adminNavPanelSrv: AdminNavPanelService, private sharedToasterSer: SharedToasterService) {
    this.firstName = '';
    this.lastName = '';
    this.pImgLink = null;
    this.selectedMenuKey = '';

    this.profileDTO = null;
    this.showErrMsg = false;
    this.errMsg = '';

  }

  ngOnInit() {
    this.init();
    this.userRole = LocalStorageSecurity.getItem(CommonKey.ROLE);
  }

  public init() {
    this.firstName = LocalStorageSecurity.getItem(CommonKey.NAME);
    this.lastName = LocalStorageSecurity.getItem(CommonKey.SURNAME);
    this.pImgLink = LocalStorageSecurity.getItem(CommonKey.PROFILE_IMG_LINK);

    const url = this.router.url.toString();
    this.selectedMenuKey = url.split('/')[2];

    this.routeChangeSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const obj = event as NavigationEnd;
        this.selectedMenuKey = obj.url.toString().split('/')[2];
      }
    });

  }

  ngOnDestroy(): void {
    if (this.routeChangeSubscription) {
      this.routeChangeSubscription.unsubscribe();
    }
  }

  public openCloseMenu(childClass: string) {
    $('.'.concat(childClass)).toggleClass('closeSubMenu').toggleClass('showSubMenu');
  }

  public getSelectedMenu(key: string): boolean {
    return this.selectedMenuKey === key;
  }

  public openNavProfileDetailModal() {
    this.adminNavPanelSrv.getProfileDetail().subscribe(
      (data) => {
        if (data.state === 1) {
          this.profileDTO = data;
          this.showErrMsg = false;
          $('#navProfileModalDTO').modal('show');
        }
      },
      error => console.log(error)
    );
  }

  public updateProfileDetail() {
    if (!this.isProfileDetailValid()) {
      this.showErrMsg = true;
      return;
    } else {
      this.showErrMsg = false;
    }

    this.adminNavPanelSrv.updateProfileDetail(JSON.stringify(this.profileDTO)).subscribe(
      (data) => {
        if (data.state === 1) {
          $('#navProfileModalDTO').modal('hide');
          this.sharedToasterSer.startSharedToasterEmitter.emit(new SharedToasterDTO('??????????????', '???????????? ??????????????????', 'success'));
          this.firstName = this.profileDTO.firstName;
          this.lastName = this.profileDTO.lastName;

          LocalStorageSecurity.setItem(CommonKey.NAME, this.firstName);
          LocalStorageSecurity.setItem(CommonKey.SURNAME, this.lastName);

        } else if (data.state === -1) {
          this.sharedToasterSer.startSharedToasterEmitter.emit(new SharedToasterDTO('????????????', '?????????????????? ????????????', 'warning'));
        }
      }
    );

  }

  private isProfileDetailValid(): boolean {
    this.errMsg = '???????? ???????????? ???????? ??????????????????: ';
    if (!this.profileDTO) {
      return false;
    }
    if (!this.profileDTO.firstName || this.profileDTO.firstName.trim().length < 3) {
      this.errMsg += '?????? ?? ?????????? ???????????? ???????? ???? ?????????? 3 ????????????????';
      return false;
    }
    if (!this.profileDTO.lastName || this.profileDTO.lastName.trim().length < 3) {
      this.errMsg += '?????????????? ?? ?????????? ???????????? ???????? ???? ?????????? 3 ????????????????';
      return false;
    }
    // if (!this.moderatorDTO.email || this.moderatorDTO.email.trim().length < 3) {
    //   return false;
    // }
    if (!this.profileDTO.phoneNumber || this.profileDTO.phoneNumber.trim().length < 3) {
      this.errMsg += '???????????????? ?? ?????????? ???????????? ???????? ???? ?????????? 3 ????????????????';
      return false;
    }
    // if (!this.moderatorDTO.login || this.moderatorDTO.login.trim().length < 3) {
    //   this.errMsg += '?????????? ?? ?????????? ???????????? ???????? ???? ?????????? 3 ????????????????';
    //   return false;
    // }
    // if (!this.moderatorDTO.password || this.moderatorDTO.password.trim().length < 3) {
    //   this.errMsg += '???????????? ?? ?????????? ???????????? ???????? ???? ?????????? 3 ????????????????';
    //   return false;
    // }
    // if (!this.moderatorDTO.repeatPassword || this.moderatorDTO.repeatPassword.trim().length < 3) {
    //   this.errMsg += '?????????????????? ???????????? ?? ?????????? ???????????? ???????? ???? ?????????? 3 ????????????????';
    //   return false;
    // }
    // if (this.moderatorDTO.password !== this.moderatorDTO.repeatPassword) {
    //   this.errMsg = '???????????? ???? ??????????????????';
    //   return false;
    // }
    return true;
  }

  public getAccess(code: number) {
    if (this.userRole === 'moderator') {  /* moderator */
      if (code === 1 || code === 2 || code === 3) {
        return true;
      }
    } else if (this.userRole === 'admin') {   /* admin */
      return true;
    }

    return false;
  }

  public openProfileImgModal() {
    $('#navProfileImageModalID').modal('show');
  }

  public onProfileImageSelect(e) {
    this.profileImgSrc = e;
  }

  public createImage() {
    const file = this.getImageAsFile(this.profileImgSrc, 'avatar.png');

    this.adminNavPanelSrv.createImage(file).subscribe(
      (data) => {
        if (data.state === 1) {
          this.updateProfileImage(data);
        }
      },
      error => console.log(error)
    );
  }

  private updateProfileImage(imgDTO: ImageDto) {
    const obj = {imgLink: imgDTO.imageName};
    this.adminNavPanelSrv.updateProfileImage(JSON.stringify(obj)).subscribe(
      (data) => {
        if (data.state === 1) {
          this.sharedToasterSer.startSharedToasterEmitter.emit(new SharedToasterDTO('??????????????', '???????????? ????????????????', 'success'));
          this.pImgLink = imgDTO.imageLink;
          LocalStorageSecurity.setItem(CommonKey.PROFILE_IMG_LINK, imgDTO.imageLink);
        } else if (data.state === 1) {
          this.sharedToasterSer.startSharedToasterEmitter.emit(new SharedToasterDTO('????????????', '?????????????????? ????????????', 'warning'));
        }
      },
      error => {
        this.sharedToasterSer.startSharedToasterEmitter.emit(new SharedToasterDTO('????????????', '?????????????????? ????????????', 'error'));
      },
      () => {
        $('#navProfileImageModalID').modal('hide');
      }
    );
  }

  private getImageAsFile(dataurl, filename) {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1])
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type: mime});
  }

  public logOut() {
    LocalStorageSecurity.removeItem(CommonKey.NAME);
    LocalStorageSecurity.removeItem(CommonKey.SURNAME);
    LocalStorageSecurity.removeItem(CommonKey.PROFILE_IMG_LINK);
    LocalStorageSecurity.removeItem(CommonKey.TOKEN);
    LocalStorageSecurity.removeItem(CommonKey.ROLE);
    this.router.navigate(['log-in']);
  }
}
