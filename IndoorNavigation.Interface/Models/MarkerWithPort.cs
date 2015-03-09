using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using IndoorNavigation.Domain.ModelClasses;

namespace IndoorNavigation.Interface.Models
{
    public class MarkerWithPort
    {
        public Marker finishMar { get; set; }
        public int port { get; set; }
    }
}