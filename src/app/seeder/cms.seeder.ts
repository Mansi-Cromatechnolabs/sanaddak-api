import { BadRequestException, Injectable } from '@nestjs/common';
import { CmsService } from '../cms/cms.service';
import { AddCmsDTO } from '../cms/dto/cms.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class CmsSeeder {
  constructor(
    private readonly cmsService: CmsService,
    private readonly userService: UserService,
  ) {}

  async seed(db_name: string) {
    const cms = await this.cmsService.GetCmsDetails(
      { page_type: 'faq' },
      db_name,
    );
    if (cms) {
      return;
    }

    let user = await this.userService.findTanantUserByEmail(
      db_name,
      process.env.DEFAULT_STAFF_EMAIL_4_SEEDER,
    );
    if (!user) {
      throw new BadRequestException('User not Found');
    }

    const cms_data = [
      {
        page_name: 'faq',
        page_content:
          '<div class="faq"><div class="faq-question">What is this FAQ about?</div><div class="faq-answer">This FAQ is about providing answers to frequently asked questions.</div></div><div class="faq"><div class="faq-question">How do I use this FAQ?</div><div class="faq-answer">You can use this FAQ by clicking on the questions to reveal the answers.</div></div><div class="faq"><div class="faq-question">Can I contribute to this FAQ?</div><div class="faq-answer">Yes, you can contribute by suggesting new questions and answers.</div></div>',
      },
      {
        page_name: 'privacy',
        page_content:
          '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Privacy Policy</title></head><body><h1>Privacy Policy</h1><p>Last updated: [Insert Date]</p><h2>Introduction</h2><p>Welcome to [Your Website Name]. This privacy policy outlines how we collect, use, and protect information about you when you visit our website.</p><h2>Information Collection</h2><p>[Describe the types of information collected]</p><h2>Protection of Information</h2><p>[Describe how information is protected]</p><h2>Contact Us</h2><p>If there are any questions regarding this privacy policy, you may contact us using the information below.</p><p>[Your Company Name]<br>[Address]<br>[City, State, Zip]<br>[Email Address]<br>[Phone Number]</p></body></html>',
      },
      {
        page_name: 'signup_tnc',
        page_content:
          '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Terms and Conditions</title></head><body><h1>Terms and Conditions</h1><h2>Governing Law</h2><p>These terms and conditions will be governed by and construed in accordance with the laws of [Your State/Country]. Any disputes relating to these terms and conditions will be subject to the exclusive jurisdiction of the courts of [Your State/Country].</p><h2>Contact Us</h2><p>If there are any questions regarding these terms and conditions, you may contact us using the information below.</p><p>[Your Company Name]<br>[Address]<br>[City, State, Zip]<br>[Email Address]<br>[Phone Number]</p></body></html>',
      },
      {
        page_name: 'aboutus',
        page_content:
          '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>About Us</title><style>body {font-family: Arial, sans-serif; margin: 20px;} h2 {margin-top: 20px;} .team-member {margin-bottom: 20px;} .team-member img {width: 100px; height: 100px; border-radius: 50%; float: left; margin-right: 20px;}</style></head><body><h1>About Us</h1><p>Welcome to [Your Company Name], a [briefly describe your company and its mission].</p><h2>Our Story</h2><p>[Tell the story of how your company came to be, including any relevant milestones or achievements].</p><h2>Our Mission</h2><p>[State your company\'s mission and values].</p><h2>Meet the Team</h2><div class="team-member"><img src="team-member-1.jpg" alt="Team Member 1"><h3>John Doe</h3><p>Founder and CEO</p><p>[Briefly describe the team member\'s background and experience].</p></div><div class="team-member"><img src="team-member-2.jpg" alt="Team Member 2"><h3>Jane Doe</h3><p>Co-Founder and CTO</p><p>[Briefly describe the team member\'s background and experience].</p></div><div class="team-member"><img src="team-member-3.jpg" alt="Team Member 3"><h3>Bob Smith</h3><p>Marketing Manager</p><p>[Briefly describe the team member\'s background and experience].</p></div><h2>Get in Touch</h2><p>If you have any questions or would like to learn more about our company, please don\'t hesitate to contact us.</p><p>[Your Company Name]<br>[Address]<br>[City, State, Zip]<br>[Email Address]<br>[Phone Number]</p></body></html>',
      },
      {
        page_name: 'guidelines',
        page_content:
          '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Gold Loan Guidelines</title></head><body><div class="container"><header><h1>Gold Loan Guidelines</h1></header><section id="eligibility"><h2>Eligibility Criteria</h2><ul><li>Minimum age: 18 years</li><li>Ownership of gold ornaments</li><li>Steady income source</li></ul></section><section id="documents-required"><h2>Documents Required</h2><ul><li>Identity Proof (Aadhaar Card, PAN Card, Passport, etc.)</li><li>Address Proof (Utility Bill, Passport, Ration Card, etc.)</li><li>Photographs</li></ul></section></div></body></html>',
      },
      {
        page_name: 'appointmnet_tnc',
        page_content:
          '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Appointment Terms and Conditions</title></head><body><div class="container"><header><h1>Appointment Terms and Conditions</h1></header><section id="documents-required"><h2>Documents Required</h2><ul><li>Identity Proof (Aadhaar Card, PAN Card, Passport, etc.)</li><li>Address Proof (Utility Bill, Passport, Ration Card, etc.)</li><li>Photographs</li></ul></section><section id="terms-conditions"><h2>Terms & Conditions</h2><ul><li>The gold ornaments will be evaluated for purity and weight.</li><li>The loan tenure can range from 3 months to 24 months.</li><li>Prepayment and foreclosure charges may apply.</li><li>In case of default, the gold ornaments will be auctioned to recover the loan amount.</li></ul></section></div></body></html>',
      },
      {
        page_name: 'kyc_tnc',
        page_content:
          '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>KYC Terms and Conditions</title></head><body><div class="container"><header><h1>KYC Terms and Conditions</h1></header><section id="eligibility"><h2>Eligibility Criteria</h2><ul><li>Minimum age: 18 years</li><li>Ownership of gold ornaments</li><li>Steady income source</li></ul></section><section id="terms-conditions"><h2>Terms & Conditions</h2><ul><li>The gold ornaments will be evaluated for purity and weight.</li><li>The loan tenure can range from 3 months to 24 months.</li><li>Prepayment and foreclosure charges may apply.</li><li>In case of default, the gold ornaments will be auctioned to recover the loan amount.</li></ul></section></div></body></html>',
      },
    ];
    for (const data of cms_data) {
      await this.cmsService.addCms(
        {
          page_type: data.page_name,
          page_content: data.page_content,
          created_by: user?.id,
        } as AddCmsDTO,
        db_name,
      );
    }

    await this.cmsService.addCms(
      {
        page_type: 'faq',
        page_content: 'hhsdfh',
        created_by: user?.id,
      } as AddCmsDTO,
      db_name,
    );
  }
}
