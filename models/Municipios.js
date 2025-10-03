// models/Municipios.js
//const mysql = require('mysql2/promise');
const mysql = require('mssql');


class Municipios {
    constructor(dbConfig) {
        this.pool = mysql.createPool(dbConfig);
    }

    async obtenerTodosMunicipios() {
        try {
            const [rows] = await this.pool.query('SELECT * FROM municipio');
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener municipios: ${error.message}`);
        }
    }

    async obtenerMunicipio(id) {
        try {
            const [rows] = await this.pool.query(
                'SELECT * FROM municipio WHERE id_municipio = ?',
                [id]
            );
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener municipio: ${error.message}`);
        }
    }

    async obtenerRutaPdfMunicipio(id) {
        try {
            const [rows] = await this.pool.query(
                'SELECT pdf, nombre FROM municipio WHERE id_municipio = ?',
                [id]
            );
            return rows[0];
        } catch (error) {
            throw new Error(`Error al obtener PDF: ${error.message}`);
        }
    }

    async obtenerEstadistica(data) {
        try {
            const conditions = Object.keys(data).map(key => `${key} = ?`).join(' AND ');
            const values = Object.values(data);
            
            const [rows] = await this.pool.query(
                `SELECT * FROM municipio WHERE ${conditions}`,
                values
            );
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener estadística: ${error.message}`);
        }
    }

    async updateMunicipio(id, data) {
        try {
            const sets = Object.keys(data).map(key => `${key} = ?`).join(', ');
            const values = [...Object.values(data), id];
            
            const [result] = await this.pool.query(
                `UPDATE municipio SET ${sets} WHERE id_municipio = ?`,
                values
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error al actualizar municipio: ${error.message}`);
        }
    }
}

module.exports = Municipios;