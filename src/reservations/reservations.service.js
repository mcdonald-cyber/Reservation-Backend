const knex = require("../db/connection");

function list(date) {
  return knex("reservations")
    .select("*")
    .whereNot({ status: 'finished' })
    .andWhere({ reservation_date: date })    
    .orderBy("reservation_time", "asc");
}

function search(mobile_number) {
  return knex('reservations')
    .whereRaw(
      "translate(mobile_number, '() -', '') like ?",
      `%${mobile_number.replace(/\D/g, '')}%`
    )
    .orderBy('reservation_date');
}

function create(reservation) {
  return knex("reservations")
    .insert(reservation)
    .returning("*")
    .then((newReservation) => newReservation[0]);
}

function read(reservation_id) {
  return knex("reservations")
    .select("*")
    .where({ reservation_id: reservation_id })
    .first();
}

function updateStatus(status, reservation_id) {
  return knex("reservations")
    .where({reservation_id})
    .update({status: status})
    .returning("*")
    .then(result => result[0]);
}

function update(updatedReservation) {
  return knex('reservations')
    .select('*')
    .where({ reservation_id: updatedReservation.reservation_id })
    .update(updatedReservation, '*')
    .then(result => result[0]);
}

module.exports = {
  list,
  search,
  create,
  read,
  update,
  updateStatus
};
