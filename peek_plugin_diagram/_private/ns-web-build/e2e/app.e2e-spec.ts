import { BuildWebForNsPage } from './app.po';

describe('build-web-for-ns App', () => {
  let page: BuildWebForNsPage;

  beforeEach(() => {
    page = new BuildWebForNsPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!!');
  });
});
