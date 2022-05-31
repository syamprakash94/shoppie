const { response } = require('express');
var express = require('express');
const async = require('hbs/lib/async');

const productHelpers = require('../helpers/product-helpers');
var router = express.Router();
var productHelper = require('../helpers/product-helpers')
const upload = require('../confiq/multer')

/* GET users listing. */
// admin login 
const cridential = {
  email: process.env.ADMIN_EMAIL,
  password: process.env.ADMIN_PASSWORD
}



const verifylogin = (req, res, next) => {
  if (req.session.admin) {
    next()
  } else {
    res.render('admin/admin-login', { login: false, home: true })
  }
}

router.post('/admin-login', (req, res) => {
  if (req.body.email == cridential.email && req.body.password == cridential.password) {

    req.session.admin = true

    res.redirect('/admin')
  } else {
    res.render('admin/admin-login', { loginadminErr: true, home: true })
  }
  loginadminErr = false

})

router.get('/admin-logout', verifylogin, (req, res) => {
  req.session.admin = false
  res.redirect('/admin')
})

// admin dashboard
router.get('/', verifylogin, async function (req, res, next) {
  let totals = await productHelpers.TotalOders()
  let total = totals[0]?.count

  let totalSale = await productHelpers.Totalsales()
  let totalSales = totalSale[0]?.count

  let totalProfits = await productHelpers.Totalprofit()
  let totalProfit = totalProfits[0]

  let totalUser = await productHelpers.Totalusers()
  let totalUsers = totalUser[0]

  let orders = await productHelpers.getAllorders()

  let dailyIncome = await productHelpers.getdailyIncome()

  res.render('admin/admin-home', { home: true, total, totalSales, totalProfit, totalUsers, orders })

});

// view products
router.get('/products', verifylogin, (req, res) => {
  productHelpers.getAllproducts().then((products) => {
    res.render('admin/view-products', { products, admin: true })
  })
})
// add product
router.get('/add-product', verifylogin, (req, res) => {
  res.render('admin/add-product', { admin: true })
})
router.post('/add-product', upload.array('image', 12), (req, res) => {

  productHelper.addproduct(req.body, req.files, (id) => {


    res.render("admin/add-product", { admin: true })
  })



})

// edit product
router.get('/edit-product/:id', verifylogin, async (req, res) => {
  let product = await productHelper.getAllproductsDetails(req.params.id)
  res.render('admin/edit-product', { product, admin: true })
})
router.post('/edit-product/:id', (req, res) => {
  productHelpers.updateProduct(req.params.id, req.body).then(() => {
    let id = req.params.id
    res.redirect('/admin/')
    if (req.files.image) {
      let image = req.files.image
      image.mv('./public/product-images/' + id + '.jpg', (err, done) => {

      })

    }
  })
})

// delete product
router.get('/delete-product/:id', verifylogin, (req, res) => {
  let proId = req.params.id
  productHelpers.deleteProduct(proId).then((response) => {
    res.redirect('/admin/products')
  })

})

// category manegement
router.get('/view-category', verifylogin, (req, res) => {

  productHelper.getAllcategory().then((category) => {
    res.render('admin/view-category', { category, admin: true })
  })


})
router.get('/add-category', verifylogin, (req, res) => {
  res.render('admin/add-category', { admin: true })

})
router.post('/add-category', (req, res) => {
  productHelper.addcategory(req.body).then((id) => {
    let categoryImage = req.files.image
    categoryImage.mv('./public/category-image/' + id + '.jpg', (err, done) => {
      if (err) {
        console.log(err);
      } else {
        res.render('admin/add-category', { admin: true })
      }
    })
    res.redirect('/admin/view-category')

  })

})
router.get('/delete-category/:id', verifylogin, (req, res) => {
  let cateId = req.params.id
  productHelper.deleteCategory(cateId).then((response) => {
    res.redirect('/admin/view-category')
  })

})

router.get('/edit-category/:id', verifylogin, async (req, res) => {
  let category = await productHelper.getAllcategoryDetails(req.params?.id)
  res.render('admin/edit-category', { category, admin: true })
})

router.post('/edit-category/:id', (req, res) => {
  productHelper.updateCategory(req.params.id, req.body).then((response) => {
    let id = req.params.id
    let images = req.files.image
    if (req.files.image) {
      images.mv('./public/category-image/' + id + '.jpg', (err, done) => {
      })
    }
    res.redirect('/admin/view-category')

  })

})

// user manegement
router.get('/all-users', (req, res) => {
  productHelper.getAllUsers().then((users) => {
    res.render('admin/all-users', { users, admin: true })
  })

})

router.get('/block-user/:id', (req, res) => {
  let id = req.params.id
  req.session.destroy()
  productHelpers.blockUsers(id).then((resp) => {
    if (resp) {
      res.redirect('/admin/all-users')
    } else {
      console.log('failed');
    }
  })
})
router.get('/unblock-user/:id', (req, res) => {
  const id = req.params.id
  productHelper.unblockUser(id).then((resp) => {
    if (resp) {
      res.redirect('/admin/all-users')
    } else {
      console.log("failed");
    }
  })
})
router.get('/delete-users/:id', (req, res) => {
  let id = req.params.id
  productHelper.deleteUsers(id).then((response) => {
    res.redirect('/admin/all-users')
  })

})
// order manegement
router.get('/all-order', verifylogin, (req, res) => {
  productHelpers.getAllorders().then((orders) => {

    res.render('admin/all-order', { admin: true, orders })
  })
})

router.get('/product-details/:id', verifylogin, async (req, res) => {

  productHelpers.getOrderProducts(req.params.id).then((order) => {
    res.render('admin/product-details', { admin: true, order })
  })
})

router.post('/statusUpdate', (req, res) => {
  let status = req.body.status
  let orderId = req.body.orderId
  productHelpers.statusUpdate(status, orderId).then((response) => {
    res.json(true)
  })
})
// banner manegement
router.get('/add-banner', verifylogin, (req, res) => {
  productHelpers.getBanner().then((banner) => {
    res.render('admin/add-banner', { banner, admin: true })
  })

})

router.post('/add-banner', verifylogin, upload.array('image', 12), (req, res) => {

  productHelper.addBanner(req.body, req.files, (id) => {
    res.redirect("/admin/add-banner")
  })

})
router.get('/delete-banner/:id', (req, res) => {
  let bannerId = req.params.id
  productHelper.deleteBanner(bannerId).then((response) => {
    res.json({ status: true })
  })

})

router.get('/getChartDetails', async (req, res) => {
  let dailyIncome = await productHelpers.getdailyIncome()
  let yearlyIncome = await productHelpers.getYearlySale()
  let month = await productHelpers.countsalemonth()
  res.json({ dailyIncome, yearlyIncome, month })
})



router.get("/report", (req, res) => {
  productHelpers.monthlyReport().then((data) => {
    res.render("admin/report", { admin: true, data })
  })
})


router.post("/report", (req, res) => {
  productHelpers.salesReport(req.body).then((data) => {
    res.render("admin/report", { admin: true, data })
  })
})


// category offer
router.get("/category-offer", async (req, res) => {

  let category = await productHelpers.getAllcategory()
  let categoryOffer = await productHelpers.getAllCategoryOffer()
  res.render("admin/category-offer", { categoryOffer, category, admin: true })
})

router.post("/category-offer", async (req, res) => {
  productHelpers.addCategoryOffer(req.body).then((response) => {
    res.redirect("/admin/category-offer")
  })

})
router.post('/delete-category-offer', (req, res) => {
  offerId = req.body
  productHelpers.deleteCategoryOffer(offerId)
  res.json({ status: true })
})

// chart report
router.get('/chart', async function (req, res, next) {
  res.render('admin/chart', { admin: true })

});

// coupon
router.get('/add-coupon', async function (req, res, next) {
  let Allcoupons = await productHelpers.getAllCoupons()
  res.render('admin/add-coupon', { admin: true, Allcoupons })

});

router.post('/add-coupon', (req, res) => {
  let data = req.body
  productHelpers.addCoupon(data).then((Resp) => {
    res.redirect('/admin/add-coupon')
  })

})

router.get('/delete-coupon/:id', (req, res) => {
  let couponId = req.params.id
  productHelper.deleteCoupon(couponId).then((response) => {
    res.json({ status: true })
  })

})



module.exports = router;
