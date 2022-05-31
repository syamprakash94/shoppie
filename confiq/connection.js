const mongoClient=require('mongodb').MongoClient
const state={
    db:null
}
module.exports.connect=function(done){
    const url='mongodb+srv://syam:9446192346@cluster0.d3cieyi.mongodb.net/?retryWrites=true&w=majority'
    const dbname='shopping'

    mongoClient.connect(url,(err,data)=>{
        if(err) return done(err)
        state.db=data.db(dbname)
       
    })
    done()
}
module.exports.get=function(){
    return state.db
}