
/// Объект который будет использоваться для хранения всей информации об объектах интерьера :
/// Компьютеры, техника и прочее... Если таковые у нас будут :)
function Furniture( Name, Mesh )
{
    this.name = Name;
    this.mesh = Mesh;
    return this;
}

function Wall( Mesh )
{
    this.Mesh = Mesh;
    return this;
}