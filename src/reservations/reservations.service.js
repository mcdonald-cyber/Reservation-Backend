const knex = require('../db/connection')
const table = 'reservations';

function list(){
    return knex(`${table}`)
    .select('*')
}

function create(reservation){
    return knex(`${table}`)
    .insert(reservation)
}

module.exports = {
list,
create
}