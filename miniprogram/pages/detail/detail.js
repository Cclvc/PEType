Page({
  data: {
    work: null,
    images: [],
    catText: ''
  },

  onLoad: function () {
    const work = wx.getStorageSync('detailWork');
    if (!work) {
      wx.navigateBack();
      return;
    }
    const catText = [];
    if (work.mainCat === 'people-pet') catText.push('人宠拍摄');
    else if (work.mainCat === 'pet-only') catText.push('只拍毛孩子');
    if (work.subCat === 'outdoor') catText.push('户外拍摄');
    else if (work.subCat === 'studio') catText.push('棚拍');
    else if (work.subCat === 'home-visit') catText.push('上门拍摄');
    let images = work.images || [];
    if (!images.length && work.src) images = [work.src];
    this.setData({
      work: work,
      images: images,
      catText: catText.join(' · ')
    });
  },

  goBack: function () {
    wx.navigateBack();
  },

  preview: function (e) {
    const idx = e.currentTarget.dataset.idx;
    const urls = this.data.images;
    wx.previewImage({ current: urls[idx], urls: urls });
  },

  onShareAppMessage: function () {
    const w = this.data.work;
    return {
      title: w ? w.title + ' — PEType 人宠摄影' : 'PEType 人宠摄影',
      path: '/pages/index/index'
    };
  }
});
