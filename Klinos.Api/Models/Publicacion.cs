using System;
using System.Text.Json.Serialization;

using Klinos.Api.Models;

public class Publicacion
{
    public int Id { get; set; }
    public int Doctor_ID { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Contenido { get; set; } = string.Empty;
    public string Tipo { get; set; } = string.Empty; // Ejemplo: "Noticia", "Consejo", "Promoción"
    public DateTime Fecha_Publicacion { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public Clinica? Clinica { get; set; }

    [JsonIgnore]
    public Doctor? Doctor { get; set; }
}