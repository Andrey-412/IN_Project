using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using IndoorNavigation.Domain.Implementations;
using IndoorNavigation.Domain.ModelClasses;

namespace IndoorNavigation.Interface.Models
{
    public class RoomWithMarkers
    {
        public Marker[] markers { get; set; }
        public Point[] points { get; set; }
    }
}