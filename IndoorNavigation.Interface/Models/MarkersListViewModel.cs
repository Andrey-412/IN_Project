using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using IndoorNavigation.Domain.ModelClasses;

namespace IndoorNavigation.Interface.Models
{
    public class MarkersListViewModel
    {
        public IEnumerable<Marker> Markers { get; set; }
        public PagingInfo PagingInfo { get; set; }
    }
}